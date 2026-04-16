const store = require('../../utils/store')
const theme = require('../../utils/theme')
const DISMISSED_KEY = 'sgj_purchase_dismissed'

function readDismissedSuggestions() {
  try {
    return wx.getStorageSync(DISMISSED_KEY) || []
  } catch (e) {
    return []
  }
}

function saveDismissedSuggestions(list) {
  wx.setStorageSync(DISMISSED_KEY, list)
}

Page({
  data: {
    themeKey: 'green',
    themeColor: '#2fb66d',
    list: [],
    hiddenSuggestionKeys: []
  },
  onShow() {
    this.setData({
      ...theme.getThemeData(store.getSettings()),
      hiddenSuggestionKeys: readDismissedSuggestions()
    })
    if (this.refreshTimer) clearTimeout(this.refreshTimer)
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null
      this.refreshList()
    }, 0)
  },
  onUnload() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  },
  refreshList() {
    const allSuggestions = store.getPurchaseSuggestions()
    const activeKeys = allSuggestions.map(item => item.dismissKey)
    const hiddenSuggestionKeys = this.data.hiddenSuggestionKeys.filter(key => activeKeys.includes(key))
    if (hiddenSuggestionKeys.length !== this.data.hiddenSuggestionKeys.length) {
      saveDismissedSuggestions(hiddenSuggestionKeys)
    }

    this.setData({
      hiddenSuggestionKeys,
      list: allSuggestions.filter(item => !hiddenSuggestionKeys.includes(item.dismissKey))
    })
  },
  showSuggestionActions(e) {
    const key = e.currentTarget.dataset.key
    if (!key) return

    wx.showActionSheet({
      itemList: ['删除'],
      itemColor: '#e54d42',
      success: res => {
        if (res.tapIndex === 0) this.deleteSuggestionByKey(key)
      }
    })
  },
  deleteSuggestionByKey(key) {
    if (!key) return

    const hiddenSuggestionKeys = Array.from(new Set([
      ...this.data.hiddenSuggestionKeys,
      key
    ]))
    saveDismissedSuggestions(hiddenSuggestionKeys)
    this.setData({
      hiddenSuggestionKeys,
      list: this.data.list.filter(item => item.dismissKey !== key)
    })
    wx.showToast({ title: '已删除建议', icon: 'none' })
  }
})
