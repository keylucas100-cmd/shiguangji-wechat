const cloud = require("wx-server-sdk");
const tencentcloud = require("tencentcloud-sdk-nodejs-asr");

const AsrClient = tencentcloud.asr.v20190614.Client;

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

function getClient() {
  const secretId = process.env.TENCENT_SECRET_ID || "";
  const secretKey = process.env.TENCENT_SECRET_KEY || "";

  if (!secretId || !secretKey) {
    throw new Error("Tencent Cloud ASR credentials are not configured");
  }

  return new AsrClient({
    credential: {
      secretId,
      secretKey,
    },
    region: process.env.TENCENT_ASR_REGION || "ap-guangzhou",
    profile: {
      httpProfile: {
        endpoint: "asr.tencentcloudapi.com",
      },
    },
  });
}

function getVoiceFormat(format) {
  const normalized = String(format || "mp3").toLowerCase();
  return normalized.replace(/^\./, "");
}

function buildCommonParams(event) {
  return {
    SubServiceType: 2,
    ProjectId: 0,
    EngSerViceType: event.engSerViceType || process.env.TENCENT_ASR_ENGINE || "16k_zh",
    VoiceFormat: getVoiceFormat(event.format || process.env.TENCENT_ASR_FORMAT),
    FilterDirty: 0,
    FilterModal: 0,
    FilterPunc: 0,
    ConvertNumMode: 1,
  };
}

function buildUrlParams(url, event) {
  return {
    ...buildCommonParams(event),
    SourceType: 0,
    Url: url,
  };
}

function buildDataParams(audioBuffer, event) {
  return {
    ...buildCommonParams(event),
    SourceType: 1,
    Data: audioBuffer.toString("base64"),
    DataLen: audioBuffer.length,
  };
}

async function getTempFileURL(fileID) {
  const tempURLResult = await cloud.getTempFileURL({
    fileList: [fileID],
  });
  const item = (tempURLResult.fileList || [])[0] || {};
  if (!item.tempFileURL) {
    throw new Error(item.errMsg || "Failed to get audio temp file URL");
  }
  return item.tempFileURL;
}

exports.main = async (event) => {
  const fileID = String(event.fileID || "").trim();
  const url = String(event.url || event.tempFileURL || "").trim();
  const client = getClient();

  let sourceType = 0;
  let params;
  if (url) {
    params = buildUrlParams(url, event);
  } else if (fileID && !event.useData) {
    params = buildUrlParams(await getTempFileURL(fileID), event);
  } else if (fileID) {
    sourceType = 1;
    const downloadResult = await cloud.downloadFile({ fileID });
    const audioBuffer = downloadResult.fileContent;
    if (!audioBuffer || !audioBuffer.length) {
      throw new Error("Audio file is empty");
    }
    params = buildDataParams(audioBuffer, event);
  } else {
    throw new Error("fileID or url is required");
  }

  const response = await client.SentenceRecognition(params);
  const text = String(response.Result || "").trim();

  return {
    text,
    result: text,
    audioDuration: response.AudioDuration || 0,
    sourceType,
  };
};
