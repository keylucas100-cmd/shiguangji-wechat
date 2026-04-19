const store = require('../../utils/store')
const theme = require('../../utils/theme')
const { getInventoryImage } = require('../../utils/inventoryImage')
const itemActions = ['编辑', '已使用', '已丢弃', '删除']
const cardPressDuration = 150
const statusOrder = {
  expired: 0,
  high_risk: 1,
  medium_risk: 2,
  low_risk: 3,
  expiring: 4,
  in_stock: 5,
  consumed: 6,
  discarded: 7
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isExpiringStatus(status) {
  return ['low_risk', 'medium_risk', 'high_risk', 'expiring'].includes(status)
}

function calculateExpireDate(productionDate, shelfLifeDays) {
  const days = Number(shelfLifeDays)
  if (!productionDate || !Number.isInteger(days) || days <= 0) return ''

  const expire = new Date(productionDate + 'T00:00:00')
  if (Number.isNaN(expire.getTime())) return ''

  expire.setDate(expire.getDate() + days)
  return formatDate(expire)
}

function getResolvedExpireDate(form) {
  return calculateExpireDate(form.productionDate, form.shelfLifeDays) || form.expireDate || ''
}

function getToday() {
  return formatDate(new Date())
}

function getUnitIndex(units, unit) {
  const idx = units.findIndex(v => v === unit)
  return idx > -1 ? idx : 0
}

function getCategoryTheme(category) {
  const map = {
    '蔬菜': 'vegetable',
    '肉类': 'meat',
    '海鲜': 'seafood',
    '蛋奶': 'egg-milk',
    '水果': 'fruit',
    '主食': 'staple',
    '调料': 'seasoning'
  }
  return map[category] || 'other'
}

function isSeafoodName(name) {
  return /(鱼|虾|蟹|贝|蛤|蚬|螺|鱿鱼|章鱼|墨鱼|带鱼|三文鱼|鳕鱼|鲈鱼|黄鱼|鲫鱼|鲤鱼|鲳鱼|扇贝|生蚝|牡蛎|海鲜)/.test(String(name || ''))
}

function getDisplayCategory(item) {
  if (item.category === '肉类' && isSeafoodName(item.name)) return '海鲜'
  return item.category
}

function sortInventoryItems(a, b) {
  const statusDiff = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
  if (statusDiff !== 0) return statusDiff

  const aExpire = a.expireDate || '9999-12-31'
  const bExpire = b.expireDate || '9999-12-31'
  if (aExpire !== bExpire) return aExpire.localeCompare(bExpire)

  return String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''))
}

function createEmptyEditForm() {
  return {
    id: '',
    name: '',
    category: '',
    quantity: '',
    unit: '',
    purchaseDate: '',
    productionDate: '',
    shelfLifeDays: '',
    lowRiskDays: '',
    mediumRiskDays: '',
    highRiskDays: '',
    expireDate: ''
  }
}

function createWarningRuleDraft(source = {}) {
  return {
    lowRiskDays: String(source.lowRiskDays || ''),
    mediumRiskDays: String(source.mediumRiskDays || ''),
    highRiskDays: String(source.highRiskDays || '')
  }
}

function formatRuleValue(value, fallback) {
  const number = Number(value)
  if (Number.isInteger(number) && number > 0) return String(number)
  return String(fallback)
}

function getWarningRuleFormData(category, source = {}) {
  const defaults = store.getCategoryWarningRules(category)
  return {
    lowRiskDays: formatRuleValue(source.lowRiskDays, defaults.lowRiskDays),
    mediumRiskDays: formatRuleValue(source.mediumRiskDays, defaults.mediumRiskDays),
    highRiskDays: formatRuleValue(source.highRiskDays, defaults.highRiskDays)
  }
}

function buildWarningRuleUpdates(prefix, category, source = {}) {
  const rules = getWarningRuleFormData(category, source)
  return {
    [`${prefix}.lowRiskDays`]: rules.lowRiskDays,
    [`${prefix}.mediumRiskDays`]: rules.mediumRiskDays,
    [`${prefix}.highRiskDays`]: rules.highRiskDays
  }
}

function getWarningRuleValidationMessage(form) {
  const lowRiskDays = Number(form.lowRiskDays)
  const mediumRiskDays = Number(form.mediumRiskDays)
  const highRiskDays = Number(form.highRiskDays)
  const isValid = [lowRiskDays, mediumRiskDays, highRiskDays].every(value => Number.isInteger(value) && value > 0)

  if (!isValid) return '请输入正确的预警阈值'
  if (lowRiskDays < mediumRiskDays || mediumRiskDays < highRiskDays) {
    return '请保持低风险阈值 ≥ 中风险阈值 ≥ 高风险阈值'
  }
  return ''
}

Page({
  data: {
    filter: 'all',
    filterOptions: [
      { key: 'all', text: '全部' },
      { key: 'in_stock', text: '正常' },
      { key: 'expiring', text: '临期' },
      { key: 'expired', text: '过期' },
      { key: 'consumed', text: '已使用' },
      { key: 'discarded', text: '已丢弃' }
    ],
    categories: store.getCategories(),
    units: ['克', '斤', '盒', '袋', '瓶'],
    themeKey: 'green',
    themeColor: '#2fb66d',
    today: getToday(),
    editVisible: false,
    animatingItemId: '',
    editCategoryIndex: 0,
    editUnitIndex: 0,
    editWarningRuleModalVisible: false,
    editWarningRuleDraft: createWarningRuleDraft(),
    editForm: createEmptyEditForm(),
    openedItemId: '',
    list: []
  },
  onShow() {
    const today = getToday()
    this.setData({
      ...theme.getThemeData(store.getSettings()),
      today
    })
    this.loadList()
  },
  setFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.filter }, () => this.loadList())
  },
  loadList() {
    let list = store.getInventory().map(item => ({
      ...item,
      displayStatus: isExpiringStatus(item.status) ? 'expiring' : item.status,
      category: getDisplayCategory(item),
      categoryTheme: getCategoryTheme(getDisplayCategory(item)),
      categoryImage: getInventoryImage(item.name, getDisplayCategory(item)),
      statusText: isExpiringStatus(item.status) ? '临期' : store.getStatusText(item.status),
      shelfLifeText: item.shelfLifeDays ? `${item.shelfLifeDays}天` : '未填写'
    }))
    if (this.data.filter !== 'all') {
      list = list.filter(item => this.data.filter === 'expiring' ? isExpiringStatus(item.status) : item.status === this.data.filter)
    }
    list = list.sort(sortInventoryItems)
    this.setData({ list })
  },
  showItemActions(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ openedItemId: '' })
    wx.showActionSheet({
      itemList: itemActions,
      success: res => {
        const action = itemActions[res.tapIndex]
        if (action === '编辑') {
          this.openEditItem(id)
        } else if (action === '已使用') {
          this.updateItemStatus(id, 'consumed')
        } else if (action === '已丢弃') {
          this.updateItemStatus(id, 'discarded')
        } else if (action === '删除') {
          this.deleteItem(id)
        }
      }
    })
  },
  editItem(e) {
    if (this.skipNextTap) {
      this.skipNextTap = false
      return
    }

    if (this.data.openedItemId) {
      this.setData({ openedItemId: '' })
      return
    }

    const id = e.currentTarget.dataset.id
    if (!id || this.data.animatingItemId) return

    this.setData({ animatingItemId: id })
    setTimeout(() => {
      this.setData({ animatingItemId: '' })
      this.openEditItem(id)
    }, cardPressDuration)
  },
  onItemTouchStart(e) {
    const touch = e.touches && e.touches[0]
    if (!touch) return

    this.touchStartX = touch.clientX
    this.touchStartY = touch.clientY
    this.touchItemId = e.currentTarget.dataset.id
  },
  onItemTouchEnd(e) {
    const touch = e.changedTouches && e.changedTouches[0]
    if (!touch || !this.touchItemId) return

    const deltaX = touch.clientX - this.touchStartX
    const deltaY = touch.clientY - this.touchStartY
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) {
      this.touchItemId = ''
      return
    }

    this.skipNextTap = true
    if (this.skipTapTimer) clearTimeout(this.skipTapTimer)
    this.skipTapTimer = setTimeout(() => {
      this.skipNextTap = false
      this.skipTapTimer = null
    }, 180)

    this.setData({
      openedItemId: deltaX < 0 ? this.touchItemId : ''
    })
    this.touchItemId = ''
  },
  deleteSwipedItem(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return

    this.setData({ openedItemId: '' })
    this.deleteItem(id)
  },
  openEditItem(id) {
    const item = store.getInventory().find(v => v.id === id)
    if (!item) return

    const editForm = {
      ...createEmptyEditForm(),
      ...item,
      ...getWarningRuleFormData(item.category, item),
      quantity: item.quantity ? String(item.quantity) : '',
      shelfLifeDays: item.shelfLifeDays ? String(item.shelfLifeDays) : ''
    }

    this.setData({
      editVisible: true,
      editForm,
      editCategoryIndex: Math.max(0, this.data.categories.findIndex(v => v === editForm.category)),
      editUnitIndex: getUnitIndex(this.data.units, editForm.unit),
      editWarningRuleModalVisible: false,
      editWarningRuleDraft: createWarningRuleDraft()
    })
  },
  closeEdit() {
    this.setData({
      editVisible: false,
      editForm: createEmptyEditForm(),
      editCategoryIndex: 0,
      editUnitIndex: 0,
      editWarningRuleModalVisible: false,
      editWarningRuleDraft: createWarningRuleDraft()
    })
  },
  onEditInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`editForm.${field}`]: e.detail.value }, () => {
      if (field === 'shelfLifeDays') this.updateEditExpireDate()
    })
  },
  onEditCategoryChange(e) {
    const idx = Number(e.detail.value)
    const category = this.data.categories[idx]
    this.setData({
      editCategoryIndex: idx,
      'editForm.category': category,
      ...buildWarningRuleUpdates('editForm', category)
    })
  },
  onEditUnitChange(e) {
    const idx = Number(e.detail.value)
    this.setData({
      editUnitIndex: idx,
      'editForm.unit': this.data.units[idx]
    })
  },
  onEditPurchaseDateChange(e) {
    const purchaseDate = e.detail.value
    if (this.data.editForm.productionDate && this.data.editForm.productionDate > purchaseDate) {
      wx.showToast({ title: '出厂日期不能晚于购买日期', icon: 'none' })
      return
    }

    this.setData({
      'editForm.purchaseDate': purchaseDate
    })
  },
  onEditProductionDateChange(e) {
    const productionDate = e.detail.value
    const { purchaseDate } = this.data.editForm

    if (purchaseDate && productionDate > purchaseDate) {
      wx.showToast({ title: '出厂日期不能晚于购买日期', icon: 'none' })
      return
    }

    this.setData({ 'editForm.productionDate': productionDate }, () => {
      this.updateEditExpireDate()
    })
  },
  updateEditExpireDate() {
    const { productionDate, shelfLifeDays } = this.data.editForm
    const expireDate = calculateExpireDate(productionDate, shelfLifeDays)
    if (!expireDate) return

    this.setData({
      'editForm.expireDate': expireDate
    })
  },
  onEditExpireDateChange(e) {
    this.setData({
      'editForm.expireDate': e.detail.value
    })
  },
  openEditWarningRuleModal() {
    if (!this.data.editForm.category) return
    this.setData({
      editWarningRuleModalVisible: true,
      editWarningRuleDraft: createWarningRuleDraft(this.data.editForm)
    })
  },
  closeEditWarningRuleModal() {
    this.setData({
      editWarningRuleModalVisible: false,
      editWarningRuleDraft: createWarningRuleDraft()
    })
  },
  onEditWarningRuleDraftInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`editWarningRuleDraft.${field}`]: e.detail.value
    })
  },
  confirmEditWarningRuleModal() {
    const draft = this.data.editWarningRuleDraft
    const warningRuleMessage = getWarningRuleValidationMessage(draft)
    if (warningRuleMessage) {
      wx.showToast({ title: warningRuleMessage, icon: 'none' })
      return
    }

    this.setData({
      'editForm.lowRiskDays': draft.lowRiskDays,
      'editForm.mediumRiskDays': draft.mediumRiskDays,
      'editForm.highRiskDays': draft.highRiskDays,
      editWarningRuleModalVisible: false,
      editWarningRuleDraft: createWarningRuleDraft()
    })
  },
  saveEdit() {
    const form = this.data.editForm

    if (!form.name) {
      wx.showToast({ title: '食材名称不能为空', icon: 'none' })
      return
    }

    if (!form.category) {
      wx.showToast({ title: '请选择分类', icon: 'none' })
      return
    }

    if (!form.quantity || Number(form.quantity) <= 0) {
      wx.showToast({ title: '请输入正确数量', icon: 'none' })
      return
    }

    if (!form.unit) {
      wx.showToast({ title: '请选择单位', icon: 'none' })
      return
    }

    if (form.purchaseDate && form.productionDate && form.purchaseDate < form.productionDate) {
      wx.showToast({ title: '购买日期不能早于出厂日期', icon: 'none' })
      return
    }

    const shelfLifeDays = Number(form.shelfLifeDays)
    if (form.shelfLifeDays && (!Number.isInteger(shelfLifeDays) || shelfLifeDays <= 0)) {
      wx.showToast({ title: '请输入正确的保质期天数', icon: 'none' })
      return
    }

    const warningRuleMessage = getWarningRuleValidationMessage(form)
    if (warningRuleMessage) {
      wx.showToast({ title: warningRuleMessage, icon: 'none' })
      return
    }

    const expireDate = getResolvedExpireDate(form)
    if (!expireDate) {
      wx.showToast({ title: '请填写预计到期日期，或补充出厂日期和保质期', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中', mask: true })

    store.upsertInventory({
      ...form,
      quantity: Number(form.quantity),
      remainingQuantity: form.consumed || form.discarded
        ? 0
        : Math.max(0, Number(form.quantity) - Number(form.consumedQuantity || 0) - Number(form.discardedQuantity || 0)),
      shelfLifeDays: Number.isInteger(shelfLifeDays) && shelfLifeDays > 0 ? shelfLifeDays : '',
      lowRiskDays: Number(form.lowRiskDays),
      mediumRiskDays: Number(form.mediumRiskDays),
      highRiskDays: Number(form.highRiskDays),
      expireDate
    })
      .then(() => {
        this.closeEdit()
        this.loadList()
        wx.showToast({ title: '修改成功', icon: 'success' })
      })
      .catch(err => {
        wx.showToast({ title: err.message || '修改失败', icon: 'none' })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },
  markUsed(e) {
    this.updateItemStatus(e.currentTarget.dataset.id, 'consumed')
  },
  markDiscarded(e) {
    this.updateItemStatus(e.currentTarget.dataset.id, 'discarded')
  },
  removeItem(e) {
    this.deleteItem(e.currentTarget.dataset.id)
  },
  updateItemStatus(id, status) {
    wx.showLoading({ title: '处理中', mask: true })
    store.updateInventoryStatus(id, status)
      .then(() => {
        this.loadList()
        wx.showToast({ title: '已更新', icon: 'success' })
      })
      .catch(err => {
        wx.showToast({ title: err.message || '处理失败', icon: 'none' })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },
  deleteItem(id) {
    wx.showLoading({ title: '删除中', mask: true })
    store.deleteInventory(id)
      .then(() => {
        this.loadList()
        wx.showToast({ title: '已删除', icon: 'success' })
      })
      .catch(err => {
        wx.showToast({ title: err.message || '删除失败', icon: 'none' })
      })
      .finally(() => {
        wx.hideLoading()
      })
  }
})
