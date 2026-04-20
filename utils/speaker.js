const store = require("./store");

const DEFAULT_MIN_INTERVAL = 15000;

let innerAudioContext = null;
let currentTask = null;
const queue = [];
const lastPlayedAt = {};

function ensureAudioContext() {
  if (innerAudioContext) return innerAudioContext;

  innerAudioContext = wx.createInnerAudioContext();
  innerAudioContext.obeyMuteSwitch = false;

  innerAudioContext.onEnded(() => finishCurrentTask());
  innerAudioContext.onError((err) => failCurrentTask(err));

  return innerAudioContext;
}

function finishCurrentTask() {
  if (!currentTask) return;
  const task = currentTask;
  currentTask = null;
  task.resolve(true);
  playNext();
}

function failCurrentTask(error) {
  if (!currentTask) return;
  const task = currentTask;
  currentTask = null;
  task.reject(error);
  playNext();
}

function isVoiceBroadcastEnabled() {
  return !!store.getSettings().voiceBroadcast;
}

function getPlayableUrl(result) {
  if (result.tempFileURL) return Promise.resolve(result.tempFileURL);
  if (result.fileID && wx.cloud && wx.cloud.getTempFileURL) {
    return wx.cloud
      .getTempFileURL({
        fileList: [result.fileID],
      })
      .then((res) => {
        const item = (res.fileList || [])[0] || {};
        return item.tempFileURL || "";
      });
  }
  return Promise.resolve("");
}

function requestSpeech(task) {
  if (!wx.cloud || !wx.cloud.callFunction) {
    return Promise.reject(new Error("wx.cloud is not initialized"));
  }

  return wx.cloud
    .callFunction({
      name: "tts",
      data: {
        text: task.text,
        key: task.key,
      },
    })
    .then((res) => getPlayableUrl(res.result || {}))
    .then((url) => {
      if (!url) throw new Error("No playable TTS audio returned");
      return url;
    });
}

function resolveTaskUrl(task) {
  if (task.url) return Promise.resolve(task.url);
  if (task.urlPromise) {
    return task.urlPromise.then((result) => {
      if (result.error) throw result.error;
      if (!result.url) throw new Error("No playable TTS audio returned");
      return result.url;
    });
  }
  return requestSpeech(task);
}

function playNext() {
  if (currentTask || !queue.length) return;

  const task = queue.shift();
  currentTask = task;

  resolveTaskUrl(task)
    .then((url) => {
      const audio = ensureAudioContext();
      audio.stop();
      audio.src = url;
      audio.play();
    })
    .catch((error) => {
      console.warn("Voice broadcast failed:", error);
      failCurrentTask(error);
  });
}

function normalizeSpeechTask(item, options = {}) {
  const rawTask =
    typeof item === "string"
      ? { text: item, key: item }
      : {
          text: item.text,
          key: item.key || item.text,
          minInterval: item.minInterval,
          force: item.force,
        };
  const text = String(rawTask.text || "").trim();
  if (!text) return null;
  return {
    text,
    key: rawTask.key || text,
    minInterval: rawTask.minInterval || options.minInterval,
    force: rawTask.force === undefined ? !!options.force : !!rawTask.force,
  };
}

function shouldPlayTask(task) {
  if (!isVoiceBroadcastEnabled()) return false;
  if (task.force) return true;
  const minInterval = Number(task.minInterval) || DEFAULT_MIN_INTERVAL;
  const now = Date.now();
  if (lastPlayedAt[task.key] && now - lastPlayedAt[task.key] < minInterval) {
    return false;
  }
  lastPlayedAt[task.key] = now;
  return true;
}

function createPrefetchPromise(task) {
  return requestSpeech(task)
    .then((url) => ({ url }))
    .catch((error) => ({ error }));
}

function enqueueTask(task) {
  return new Promise((resolve, reject) => {
    queue.push({
      ...task,
      resolve,
      reject,
    });
    playNext();
  });
}

function speak(text, options = {}) {
  const task = normalizeSpeechTask(
    {
      text,
      key: options.key || text,
      minInterval: options.minInterval,
      force: options.force,
    },
    options,
  );
  if (!task || !shouldPlayTask(task)) return Promise.resolve(false);
  return enqueueTask(task);
}

function speakBatch(items = [], options = {}) {
  const tasks = items
    .map((item) => normalizeSpeechTask(item, options))
    .filter((item) => item && shouldPlayTask(item))
    .map((item) => ({
      ...item,
      urlPromise: createPrefetchPromise(item),
    }));

  if (!tasks.length) return Promise.resolve(false);
  return Promise.all(tasks.map((task) => enqueueTask(task).catch(() => false)));
}

function stop() {
  queue.length = 0;
  if (innerAudioContext) innerAudioContext.stop();
  currentTask = null;
}

module.exports = {
  speak,
  speakBatch,
  stop,
};
