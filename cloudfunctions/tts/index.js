const cloud = require("wx-server-sdk");
const crypto = require("crypto");
const tencentcloud = require("tencentcloud-sdk-nodejs-tts");

const TtsClient = tencentcloud.tts.v20190823.Client;

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

function getClient() {
  const secretId = process.env.TENCENT_SECRET_ID || "";
  const secretKey = process.env.TENCENT_SECRET_KEY || "";

  if (!secretId || !secretKey) {
    throw new Error("Tencent Cloud TTS credentials are not configured");
  }

  return new TtsClient({
    credential: {
      secretId,
      secretKey,
    },
    region: process.env.TENCENT_TTS_REGION || "ap-guangzhou",
    profile: {
      httpProfile: {
        endpoint: "tts.tencentcloudapi.com",
      },
    },
  });
}

function buildParams(text, sessionId) {
  return {
    Text: text,
    SessionId: sessionId,
    ModelType: 1,
    VoiceType: Number(process.env.TENCENT_TTS_VOICE_TYPE || 101001),
    PrimaryLanguage: 1,
    Codec: "mp3",
    SampleRate: 16000,
    Volume: 5,
    Speed: 0,
    ProjectId: 0,
  };
}

exports.main = async (event) => {
  const text = String(event.text || "").trim();
  if (!text) {
    throw new Error("text is required");
  }

  const sessionId = String(event.key || `tts_${Date.now()}`).slice(0, 50);
  const client = getClient();
  const response = await client.TextToVoice(buildParams(text, sessionId));

  if (!response.Audio) {
    throw new Error("Tencent Cloud TTS returned empty audio");
  }

  const audioBuffer = Buffer.from(response.Audio, "base64");
  const textHash = crypto.createHash("md5").update(text).digest("hex");
  const cloudPath = `tts/${textHash}-${Date.now()}.mp3`;
  const uploadResult = await cloud.uploadFile({
    cloudPath,
    fileContent: audioBuffer,
  });

  return {
    fileID: uploadResult.fileID,
    text,
  };
};
