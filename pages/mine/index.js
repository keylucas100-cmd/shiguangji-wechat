const store = require('../../utils/store')
const theme = require('../../utils/theme')

function getNameMeasureText(name) {
  return name || '请输入用户名'
}

function getAvatarText(name) {
  return (name || '食').trim().slice(0, 1) || '食'
}

function getThemeColor(themeKey) {
  return theme.getTheme(themeKey).color
}

Page({
  data: {
    avatarText: 'L',
    themeColor: '#2fb66d',
    nameInputWidth: 80,
    nameFieldWidth: 132,
    nameMeasureText: 'Lucas',
    themeOptions: theme.themeOptions,
    settings: {
      userName: 'Lucas',
      elderlyMode: false,
      voiceBroadcast: true,
      themeKey: 'green'
    }
  },
  onShow() {
    const settings = store.getSettings()
    this.setData({
      settings,
      avatarText: getAvatarText(settings.userName),
      themeColor: getThemeColor(settings.themeKey),
      nameMeasureText: getNameMeasureText(settings.userName)
    }, () => {
      this.updateNameInputWidth()
    })
  },
  onUserNameInput(e) {
    const settings = { ...this.data.settings, userName: e.detail.value }
    store.saveSettings(settings)
    this.setData({
      settings,
      avatarText: getAvatarText(settings.userName),
      nameMeasureText: getNameMeasureText(settings.userName)
    }, () => {
      this.updateNameInputWidth()
    })
  },
  updateNameInputWidth() {
    wx.createSelectorQuery()
      .in(this)
      .select('.name-measurer')
      .boundingClientRect(rect => {
        if (!rect) return
        const { windowWidth } = wx.getSystemInfoSync()
        const width = Math.ceil((rect.width * 750) / windowWidth)
        // Native input on real devices needs a little extra room for cursor
        // and internal text rendering; otherwise short names can still ellipsize.
        const inputWidth = Math.min(Math.max(width + 28, 96), 260)
        this.setData({
          nameInputWidth: inputWidth,
          nameFieldWidth: Math.min(Math.max(inputWidth + 44, 140), 304)
        })
      })
      .exec()
  },
  toggleElderly(e) {
    const settings = { ...this.data.settings, elderlyMode: e.detail.value }
    store.saveSettings(settings)
    this.setData({ settings })
  },
  toggleVoice(e) {
    const settings = { ...this.data.settings, voiceBroadcast: e.detail.value }
    store.saveSettings(settings)
    this.setData({ settings })
  },
  selectTheme(e) {
    const themeKey = e.currentTarget.dataset.theme
    const settings = { ...this.data.settings, themeKey }
    store.saveSettings(settings)
    this.setData({
      settings,
      themeColor: getThemeColor(themeKey)
    })
  },
  goStats() {
    wx.navigateTo({ url: '/pages/stats/index' })
  }
})
