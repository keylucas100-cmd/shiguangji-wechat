# 食光机微信小程序骨架

## 页面
- 首页
- 食材录入
- 库存列表
- 菜谱推荐
- 采购建议
- 数据统计
- 我的

## 运行
1. 解压后，用 VSCode 打开整个项目目录编辑
2. 用微信开发者工具导入当前目录运行

## 语音播报
1. 在微信开发者工具中开通云开发，并关联当前项目云环境
2. 上传并部署 `cloudfunctions/tts`
3. 在云函数环境变量中配置：
   - `TENCENT_SECRET_ID`
   - `TENCENT_SECRET_KEY`
   - `TENCENT_TTS_REGION`，可选，默认 `ap-guangzhou`
   - `TENCENT_TTS_VOICE_TYPE`，可选，默认 `101001`

完成后，开启“我的”页面中的“语音播报”开关，就会在首页提醒、采购建议、解析成功和保存成功时播报动态内容。

## 语音转文字
1. 在腾讯云开通语音识别 ASR
2. 上传并部署 `cloudfunctions/asr`
3. 在 `asr` 云函数环境变量中配置：
   - `TENCENT_SECRET_ID`
   - `TENCENT_SECRET_KEY`
   - `TENCENT_ASR_REGION`，可选，默认 `ap-guangzhou`
   - `TENCENT_ASR_ENGINE`，可选，默认 `16k_zh`

完成后，打开食材录入页，点击麦克风录音，结束录音后会自动识别成文字，再点击“解析填入”。
