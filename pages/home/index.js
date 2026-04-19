const store = require('../../utils/store')
const speaker = require('../../utils/speaker')
const theme = require('../../utils/theme')
const { getInventoryImage } = require('../../utils/inventoryImage')

const dismissedPurchaseKey = 'sgj_purchase_dismissed'
const homePreviewCount = 3
const oneDayMs = 24 * 60 * 60 * 1000

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

function resolveCategory(item) {
  return item.category || inferCategoryByName(item.name)
}

function getHomeSuggestionReason(item) {
  if (item.urgency === 'urgent') return '已用完，建议尽快购买'
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
  const category = resolveCategory(item)
  return {
    ...item,
    category,
    image: getInventoryImage(item.name, category),
    itemClass: item.urgency === 'urgent' ? 'purchase-urgent' : 'purchase-low',
    priorityText: item.urgency === 'urgent' ? '优先采购' : '',
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
    purchaseSuggestions: suggestions.slice(0, homePreviewCount),
    hasMorePurchaseSuggestions: suggestions.length > homePreviewCount
  }
}

function getExpireTime(item) {
  if (!item.expireDate) return Number.MAX_SAFE_INTEGER
  const time = new Date(`${item.expireDate}T00:00:00`).getTime()
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time
}

function getReminderPriority(status) {
  if (status === 'expired') return 0
  if (status === 'high_risk') return 1
  if (status === 'medium_risk') return 2
  if (status === 'low_risk') return 3
  return 4
}

function sortReminderItems(a, b) {
  const priorityDiff = getReminderPriority(a.status) - getReminderPriority(b.status)
  if (priorityDiff !== 0) return priorityDiff

  const expireTimeDiff = getExpireTime(a) - getExpireTime(b)
  if (expireTimeDiff !== 0) return expireTimeDiff

  return String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''))
}

function getReminderStyle(status) {
  if (status === 'expired' || status === 'high_risk') {
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
  today.setHours(0, 0, 0, 0)

  const expire = new Date(`${expireDate}T00:00:00`)
  if (Number.isNaN(expire.getTime())) return Number.MAX_SAFE_INTEGER

  return Math.round((expire.getTime() - today.getTime()) / oneDayMs)
}

function getReminderDayText(days, status) {
  if (days === Number.MAX_SAFE_INTEGER) return '请补充到期日期，方便系统提醒'
  if (status === 'expired' || days < 0) return `已过期${Math.abs(days)}天`
  if (days === 0) return '今日到期'
  if (days === 1) return '明日到期'
  return `${days}天后到期`
}

function decorateReminderItem(item) {
  const category = resolveCategory(item)
  const days = getDaysToExpire(item.expireDate)
  const reminderStyle = getReminderStyle(item.status)
  const noticeText = getReminderDayText(days, item.status)

  return {
    ...item,
    category,
    image: getInventoryImage(item.name, category),
    daysText: noticeText,
    noticeText,
    badgeClass: reminderStyle.badgeClass,
    itemClass: reminderStyle.itemClass
  }
}

function decorateDefaultReminderItem(item) {
  const category = resolveCategory(item)
  const reminderStyle = getReminderStyle(item.status)
  const days = getDaysToExpire(item.expireDate)

  return {
    ...item,
    category,
    image: getInventoryImage(item.name, category),
    daysText: days === Number.MAX_SAFE_INTEGER ? '到期时间待补充' : `${Math.max(days, 0)}天后到期`,
    badgeClass: reminderStyle.badgeClass,
    itemClass: reminderStyle.itemClass
  }
}

function getReminderSubtitle(reminders) {
  const expiredCount = reminders.expired.length
  const expiringCount = reminders.expiring.length

  if (expiredCount && expiringCount) {
    return `有 ${expiredCount} 样已过期，${expiringCount} 样即将到期，请优先查看`
  }
  if (expiredCount) return `有 ${expiredCount} 样食材已过期，请尽快处理`
  if (expiringCount) return `有 ${expiringCount} 样食材即将到期，请及时安排`
  return '目前没有临期或过期食材，继续保持'
}

function getDefaultReminderSubtitle(reminders) {
  const expiringCount = reminders.expiring.length
  if (expiringCount) return `有 ${expiringCount} 样食品临期了，请赶快处理`
  return '目前没有食品临期，继续保持'
}

function getPurchaseSubtitle(purchaseCount) {
  if (!purchaseCount) return '常用食材库存充足，暂时不用采购'
  return `有 ${purchaseCount} 样常用食材建议补货`
}

function buildHomeVoiceMessages(reminders, purchaseData) {
  const messages = []
  const expiredCount = reminders.expired.length
  const expiringCount = reminders.expiring.length

  if (expiredCount) {
    messages.push({
      text: `你有${expiredCount}样食材已过期，${expiringCount}样即将到期，请尽快处理`,
      key: `home-reminder-${expiredCount}-${expiringCount}`,
      minInterval: 30000
    })
  } else if (expiringCount) {
    messages.push({
      text: `你有${expiringCount}样食品临期了，请赶快处理`,
      key: `home-expiring-${expiringCount}`,
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
    elderlyMode: false,
    summary: { expiringCount: 0, expiredCount: 0, totalCount: 0 },
    reminderSubtitle: '',
    purchaseSubtitle: '',
    purchaseCount: 0,
    purchaseSuggestions: [],
    hasMorePurchaseSuggestions: false,
    hasMoreReminders: false,
    reminderList: [],
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
        const elderlyMode = !!settings.elderlyMode
        const inventory = store.getInventory()
        const reminders = store.getReminderSummary()
        const purchaseData = getHomeSuggestionData()
        const reminderItems = (elderlyMode
          ? [...reminders.expired, ...reminders.expiring]
          : reminders.expiring.slice())
          .slice()
          .sort(sortReminderItems)
        const defaultExpiringList = reminders.expiring.slice().sort(sortReminderItems)

        this.setData({
          ...theme.getThemeData(settings),
          elderlyMode,
          summary: {
            expiringCount: reminders.expiring.length,
            expiredCount: reminders.expired.length,
            totalCount: inventory.length
          },
          reminderSubtitle: elderlyMode ? getReminderSubtitle(reminders) : getDefaultReminderSubtitle(reminders),
          purchaseSubtitle: getPurchaseSubtitle(purchaseData.purchaseCount),
          purchaseCount: purchaseData.purchaseCount,
          purchaseSuggestions: purchaseData.purchaseSuggestions,
          hasMorePurchaseSuggestions: purchaseData.hasMorePurchaseSuggestions,
          hasMoreReminders: reminderItems.length > homePreviewCount,
          reminderList: reminderItems.slice(0, homePreviewCount).map(decorateReminderItem),
          hasMoreExpiringReminders: defaultExpiringList.length > homePreviewCount,
          expiringList: defaultExpiringList.slice(0, homePreviewCount).map(decorateDefaultReminderItem)
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
