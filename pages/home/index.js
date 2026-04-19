const store = require('../../utils/store')
const speaker = require('../../utils/speaker')
const theme = require('../../utils/theme')
const { getInventoryImage } = require('../../utils/inventoryImage')
const dismissedPurchaseKey = 'sgj_purchase_dismissed'

function inferCategoryByName(name) {
  const text = String(name || '')
  if (/(鱼|虾|蟹|贝|蛤|蚬|螺|鱿鱼|章鱼|墨鱼|带鱼|三文鱼|鳕鱼|鲈鱼|黄鱼|鲫鱼|鲤鱼|鲳鱼|扇贝|生蚝|牡蛎|海鲜)/.test(text)) return '海鲜'
  if (/肉/.test(text)) return '肉类'
  if (/(蛋|奶|芝士|奶酪|黄油)/.test(text)) return '蛋奶'
  if (/(香蕉|苹果|橙|橘|梨|葡萄|草莓|蓝莓|西瓜|哈密瓜|桃|芒果|火龙果|猕猴桃|柠檬)/.test(text)) return '水果'
  if (/(米|饭|面|馒头|包子|饺子|馄饨|粉|燕麦|红薯|紫薯)/.test(text)) return '主食'
  if (/(盐|糖|酱|醋|料酒|蚝油|胡椒|孜然|辣椒粉|葱|姜|蒜|香菜)/.test(text)) return '调料'
  return '其他'
}

function getHomeSuggestionReason(item) {
  if (item.urgency === 'urgent') return '已用完，建议购买'
  if (item.quantityText && item.quantityText !== '0') return `仅剩 ${item.quantityText}，建议补充`
  return '常用食材，库存已不足'
}

function readDismissedSuggestions() {
  try {
    return wx.getStorageSync(dismissedPurchaseKey) || []
  } catch (e) {
    return []
  }
}

function decoratePurchaseSuggestion(item) {
  const category = item.category || inferCategoryByName(item.name)
  return {
    ...item,
    category,
    image: getInventoryImage(item.name, category),
    itemClass: item.urgency === 'urgent' ? 'purchase-urgent' : 'purchase-low',
    priorityText: item.urgency === 'urgent' ? '高优先' : '',
    homeReason: getHomeSuggestionReason(item)
  }
}

function getHomeSuggestionData() {
  const hiddenKeys = readDismissedSuggestions()
  const suggestions = store.getPurchaseSuggestions()
    .filter(item => !hiddenKeys.includes(item.dismissKey))
    .map(decoratePurchaseSuggestion)

  return {
    purchaseCount: suggestions.length,
    purchaseSuggestions: suggestions.slice(0, 3),
    hasMorePurchaseSuggestions: suggestions.length > 3
  }
}

function getExpireTime(item) {
  if (!item.expireDate) return Number.MAX_SAFE_INTEGER
  const time = new Date(`${item.expireDate}T00:00:00`).getTime()
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time
}

function sortByExpireDate(a, b) {
  const timeDiff = getExpireTime(a) - getExpireTime(b)
  if (timeDiff !== 0) return timeDiff
  return String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''))
}

function getReminderStyle(status) {
  if (status === 'high_risk') {
    return { badgeClass: 'badge-danger', itemClass: 'item-danger' }
  }
  if (status === 'medium_risk') {
    return { badgeClass: 'badge-orange', itemClass: 'item-orange' }
  }
  return { badgeClass: 'badge-warning', itemClass: 'item-warning' }
}

function getDaysToExpire(expireDate) {
  if (!expireDate) return Number.MAX_SAFE_INTEGER
  const today = new Date()
  const expire = new Date(`${expireDate}T23:59:59`)
  const diff = Math.ceil((expire - today) / (1000 * 60 * 60 * 24))
  return Number.isFinite(diff) ? diff : Number.MAX_SAFE_INTEGER
}

function buildHomeVoiceMessages(reminders, purchaseData) {
  const messages = []

  if (reminders.expiring.length) {
    messages.push({
      text: `你有${reminders.expiring.length}样食品临期了，请赶快处理~`,
      key: `home-expiring-${reminders.expiring.length}`,
      minInterval: 30000
    })
  }

  if (purchaseData.purchaseCount) {
    messages.push({
      text: `你有${purchaseData.purchaseCount}样食材快没了，建议及时采购`,
      key: `home-purchase-${purchaseData.purchaseCount}`,
      minInterval: 30000
    })
  }

  return messages
}

Page({
  data: {
    themeKey: 'green',
    themeColor: '#2fb66d',
    summary: { expiringCount: 0, expiredCount: 0, totalCount: 0 },
    purchaseCount: 0,
    purchaseSuggestions: [],
    hasMorePurchaseSuggestions: false,
    hasMoreExpiringReminders: false,
    expiringList: []
  },
  onShow() {
    this.refreshHomeData()
  },
  refreshHomeData() {
    store.syncInventoryFromServer()
      .catch(() => null)
      .finally(() => {
    const settings = store.getSettings()
    const inventory = store.getInventory()
    const reminders = store.getReminderSummary()
    const expiringReminders = reminders.expiring.slice().sort(sortByExpireDate)
    const purchaseData = getHomeSuggestionData()
    this.setData({
      ...theme.getThemeData(settings),
      summary: {
        expiringCount: reminders.expiring.length,
        expiredCount: reminders.expired.length,
        totalCount: inventory.length
      },
      purchaseCount: purchaseData.purchaseCount,
      purchaseSuggestions: purchaseData.purchaseSuggestions,
      hasMorePurchaseSuggestions: purchaseData.hasMorePurchaseSuggestions,
      hasMoreExpiringReminders: expiringReminders.length > 3,
      expiringList: expiringReminders.slice(0, 3).map(item => {
        const reminderStyle = getReminderStyle(item.status)
        const badgeClass = reminderStyle.badgeClass
        const itemClass = reminderStyle.itemClass
        const days = getDaysToExpire(item.expireDate)

        return {
          ...item,
          daysText: days === Number.MAX_SAFE_INTEGER ? '到期时间待补充' : `${Math.max(days, 0)}天后到期`,
          badgeClass,
          itemClass
        }
      })
        }, () => {
          speaker.speakBatch(buildHomeVoiceMessages(reminders, purchaseData)).catch(() => false)
        })
      })
  },
  goInventory() {
    wx.switchTab({ url: '/pages/inventory/index' })
  },
  goPurchase() {
    wx.navigateTo({ url: '/pages/purchase/index' })
  }
})
