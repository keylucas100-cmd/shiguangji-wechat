const INVENTORY_KEY = 'sgj_inventory'
const SETTINGS_KEY = 'sgj_settings'
const HISTORY_KEY = 'sgj_history'

const defaultSettings = {
  userName: 'Lucas',
  elderlyMode: false,
  voiceBroadcast: true,
  themeKey: 'green'
}

const ingredientAliasMap = {
  西红柿: '番茄',
  马铃薯: '土豆',
  洋芋: '土豆',
  鸡子: '鸡蛋',
  花椰菜: '西兰花',
  青菜: '生菜',
  小葱: '葱',
  大葱: '葱',
  蒜头: '蒜',
  蒜米: '蒜',
  番薯: '红薯',
  牛腩: '牛肉',
  肥牛: '牛肉',
  牛排: '牛肉',
  五花肉: '猪肉',
  里脊肉: '猪肉',
  肉末: '猪肉',
  鸡胸肉: '鸡肉',
  鸡腿: '鸡肉',
  鸡翅: '鸡肉',
  虾仁: '虾',
  虾滑: '虾'
}

const builtinRecipes = [
  {
    id: 'r1',
    name: '番茄炒蛋',
    cover: '/assets/recipes/tomato-egg.jpg',
    category: '家常菜',
    difficulty: '简单',
    cookTime: 10,
    ingredients: [
      { name: '番茄', amount: '2个', required: true },
      { name: '鸡蛋', amount: '3个', required: true },
      { name: '葱', amount: '少许', required: false }
    ],
    seasonings: [
      { name: '盐', amount: '少许' },
      { name: '油', amount: '适量' }
    ],
    steps: ['番茄切块，鸡蛋打散。', '先炒鸡蛋后盛出。', '下番茄翻炒出汁，再倒回鸡蛋。', '加盐调味，撒葱出锅。'],
    tags: ['下饭', '省时', '家常']
  },
  {
    id: 'r2',
    name: '青椒炒肉',
    cover: '/assets/recipes/pepper-pork.jpg',
    category: '家常菜',
    difficulty: '简单',
    cookTime: 15,
    ingredients: [
      { name: '青椒', amount: '2个', required: true },
      { name: '猪肉', amount: '200克', required: true },
      { name: '蒜', amount: '2瓣', required: false }
    ],
    seasonings: [
      { name: '生抽', amount: '1勺' },
      { name: '盐', amount: '少许' },
      { name: '油', amount: '适量' }
    ],
    steps: ['猪肉切片，用生抽抓匀。', '青椒切块，蒜切末。', '热锅炒肉片至变色。', '加入青椒和蒜末翻炒，调味出锅。'],
    tags: ['下饭', '家常', '省时']
  },
  {
    id: 'r3',
    name: '西兰花虾仁',
    cover: '/assets/recipes/shrimp-broccoli.jpg',
    category: '轻食',
    difficulty: '简单',
    cookTime: 12,
    ingredients: [
      { name: '西兰花', amount: '1颗', required: true },
      { name: '虾', amount: '150克', required: true },
      { name: '蒜', amount: '2瓣', required: false }
    ],
    seasonings: [
      { name: '盐', amount: '少许' },
      { name: '油', amount: '适量' }
    ],
    steps: ['西兰花切小朵焯水。', '虾处理干净，蒜切末。', '热锅爆香蒜末，下虾炒至变色。', '加入西兰花翻炒，调味后出锅。'],
    tags: ['轻食', '高蛋白', '省时']
  },
  {
    id: 'r4',
    name: '牛奶燕麦杯',
    cover: '/assets/recipes/milk-oat.jpg',
    category: '早餐',
    difficulty: '简单',
    cookTime: 5,
    ingredients: [
      { name: '牛奶', amount: '200毫升', required: true },
      { name: '燕麦', amount: '40克', required: true },
      { name: '香蕉', amount: '1根', required: false }
    ],
    seasonings: [
      { name: '蜂蜜', amount: '少许' }
    ],
    steps: ['杯中加入燕麦和牛奶。', '香蕉切片铺在表面。', '按喜好加少许蜂蜜。'],
    tags: ['早餐', '免开火', '轻食']
  },
  {
    id: 'r5',
    name: '土豆炖牛肉',
    cover: '/assets/recipes/braised-beef-potato.jpg',
    category: '家常菜',
    difficulty: '中等',
    cookTime: 45,
    ingredients: [
      { name: '牛肉', amount: '300克', required: true },
      { name: '土豆', amount: '2个', required: true },
      { name: '胡萝卜', amount: '1根', required: false }
    ],
    seasonings: [
      { name: '生抽', amount: '2勺' },
      { name: '老抽', amount: '半勺' },
      { name: '盐', amount: '少许' }
    ],
    steps: ['牛肉切块焯水。', '土豆和胡萝卜切块。', '牛肉加调料炖煮30分钟。', '加入土豆继续炖至软烂。'],
    tags: ['炖菜', '下饭', '家常']
  },
  {
    id: 'r6',
    name: '黄瓜炒蛋',
    cover: '/assets/recipes/cucumber-eggs.jpg',
    category: '简餐',
    difficulty: '简单',
    cookTime: 10,
    ingredients: [
      { name: '黄瓜', amount: '1根', required: true },
      { name: '鸡蛋', amount: '2个', required: true }
    ],
    seasonings: [
      { name: '盐', amount: '少许' },
      { name: '油', amount: '适量' }
    ],
    steps: ['黄瓜切片，鸡蛋打散。', '先炒鸡蛋盛出。', '下黄瓜快速翻炒。', '倒回鸡蛋，调味出锅。'],
    tags: ['省时', '清爽', '家常']
  },
  {
    id: 'r7',
    name: '紫菜蛋花汤',
    cover: '/assets/recipes/seaweed-egg-soup.jpg',
    category: '汤类',
    difficulty: '简单',
    cookTime: 8,
    ingredients: [
      { name: '鸡蛋', amount: '1个', required: true },
      { name: '紫菜', amount: '少许', required: true },
      { name: '葱', amount: '少许', required: false }
    ],
    seasonings: [
      { name: '盐', amount: '少许' },
      { name: '香油', amount: '几滴' }
    ],
    steps: ['水烧开后放入紫菜。', '鸡蛋打散淋入锅中。', '加盐调味，撒葱花。', '出锅前滴香油。'],
    tags: ['汤', '省时', '清淡']
  },
  {
    id: 'r8',
    name: '冬瓜排骨汤',
    cover: '/assets/recipes/winter-melon-pork-soup.jpg',
    category: '汤类',
    difficulty: '中等',
    cookTime: 50,
    ingredients: [
      { name: '冬瓜', amount: '300克', required: true },
      { name: '排骨', amount: '300克', required: true },
      { name: '姜', amount: '2片', required: false }
    ],
    seasonings: [
      { name: '盐', amount: '少许' },
      { name: '料酒', amount: '1勺' }
    ],
    steps: ['排骨焯水洗净。', '冬瓜切块，姜切片。', '排骨加水炖40分钟。', '加入冬瓜煮熟，调味即可。'],
    tags: ['汤', '清爽', '家常']
  },
  {
    id: 'r9',
    name: '番茄牛腩汤',
    cover: '/assets/recipes/tomato-beef-soup.jpg',
    category: '汤类',
    difficulty: '中等',
    cookTime: 55,
    ingredients: [
      { name: '番茄', amount: '2个', required: true },
      { name: '牛肉', amount: '300克', required: true },
      { name: '土豆', amount: '1个', required: false }
    ],
    seasonings: [
      { name: '盐', amount: '少许' },
      { name: '生抽', amount: '1勺' }
    ],
    steps: ['牛肉切块焯水。', '番茄切块炒出汁。', '加入牛肉和清水炖煮。', '出锅前调味。'],
    tags: ['汤', '暖胃', '家常']
  },
  {
    id: 'r10',
    name: '香菇鸡肉粥',
    cover: '/assets/recipes/chicken-mushroom-congee.jpg',
    category: '主食',
    difficulty: '简单',
    cookTime: 30,
    ingredients: [
      { name: '大米', amount: '半杯', required: true },
      { name: '鸡肉', amount: '120克', required: true },
      { name: '香菇', amount: '3朵', required: true }
    ],
    seasonings: [
      { name: '盐', amount: '少许' },
      { name: '姜', amount: '少许' }
    ],
    steps: ['大米洗净煮粥。', '鸡肉切丝，香菇切片。', '粥煮开后加入鸡肉和香菇。', '煮至浓稠后调味。'],
    tags: ['早餐', '暖胃', '轻食']
  },
  {
    id: 'r11',
    name: '鸡蛋三明治',
    cover: '/assets/recipes/egg-sandwich.jpg',
    category: '早餐',
    difficulty: '简单',
    cookTime: 10,
    ingredients: [
      { name: '面包', amount: '2片', required: true },
      { name: '鸡蛋', amount: '1个', required: true },
      { name: '生菜', amount: '2片', required: false }
    ],
    seasonings: [
      { name: '沙拉酱', amount: '适量' }
    ],
    steps: ['鸡蛋煎熟。', '面包片加热。', '夹入生菜、鸡蛋和沙拉酱。'],
    tags: ['早餐', '省时', '便当']
  },
  {
    id: 'r12',
    name: '香蕉酸奶杯',
    cover: '/assets/recipes/banana-yogurt--cup.jpg',
    category: '早餐',
    difficulty: '简单',
    cookTime: 5,
    ingredients: [
      { name: '香蕉', amount: '1根', required: true },
      { name: '酸奶', amount: '1杯', required: true },
      { name: '燕麦', amount: '少许', required: false }
    ],
    seasonings: [
      { name: '蜂蜜', amount: '少许' }
    ],
    steps: ['香蕉切片。', '杯中倒入酸奶。', '加入香蕉和燕麦。'],
    tags: ['早餐', '免开火', '轻食']
  },
  {
    id: 'r13',
    name: '蔬菜沙拉',
    cover: '/assets/recipes/vegetable-salad.jpg',
    category: '轻食',
    difficulty: '简单',
    cookTime: 8,
    ingredients: [
      { name: '生菜', amount: '适量', required: true },
      { name: '黄瓜', amount: '半根', required: true },
      { name: '番茄', amount: '1个', required: false }
    ],
    seasonings: [
      { name: '沙拉酱', amount: '适量' },
      { name: '盐', amount: '少许' }
    ],
    steps: ['蔬菜洗净沥干。', '黄瓜和番茄切块。', '加入沙拉酱拌匀。'],
    tags: ['轻食', '清爽', '免开火']
  },
  {
    id: 'r14',
    name: '煎鸡胸肉',
    cover: '/assets/recipes/grilled-chicken-breast.jpg',
    category: '轻食',
    difficulty: '简单',
    cookTime: 15,
    ingredients: [
      { name: '鸡肉', amount: '200克', required: true },
      { name: '生菜', amount: '适量', required: false }
    ],
    seasonings: [
      { name: '盐', amount: '少许' },
      { name: '黑胡椒', amount: '少许' },
      { name: '油', amount: '少许' }
    ],
    steps: ['鸡肉用盐和黑胡椒腌制。', '平底锅少油加热。', '两面煎至金黄熟透。'],
    tags: ['高蛋白', '省时', '轻食']
  },
  {
    id: 'r15',
    name: '青椒土豆丝',
    cover: '/assets/recipes/Stir-friedShreddedPotatowithGreenPepper.jpg',
    category: '家常菜',
    difficulty: '简单',
    cookTime: 12,
    ingredients: [
      { name: '青椒', amount: '1个', required: true },
      { name: '土豆', amount: '2个', required: true }
    ],
    seasonings: [
      { name: '盐', amount: '少许' },
      { name: '醋', amount: '少许' },
      { name: '油', amount: '适量' }
    ],
    steps: ['土豆切丝泡水。', '青椒切丝。', '热锅下土豆丝翻炒。', '加入青椒和调料炒匀。'],
    tags: ['家常', '下饭', '素菜']
  },
  {
    id: 'r16',
    name: '蒜蓉生菜',
    cover: '/assets/recipes/Garlic Lettuce Stir-fry.jpg',
    category: '简餐',
    difficulty: '简单',
    cookTime: 8,
    ingredients: [
      { name: '生菜', amount: '1颗', required: true },
      { name: '蒜', amount: '3瓣', required: false }
    ],
    seasonings: [
      { name: '盐', amount: '少许' },
      { name: '生抽', amount: '1勺' },
      { name: '油', amount: '适量' }
    ],
    steps: ['生菜洗净沥干。', '蒜切末。', '爆香蒜末后下生菜快炒。', '调味出锅。'],
    tags: ['省时', '素菜', '清爽']
  },
  {
    id: 'r17',
    name: '红烧茄子',
    cover: '/assets/recipes/Braised Eggplant.jpg',
    category: '家常菜',
    difficulty: '中等',
    cookTime: 20,
    ingredients: [
      { name: '茄子', amount: '2根', required: true },
      { name: '蒜', amount: '2瓣', required: false },
      { name: '葱', amount: '少许', required: false }
    ],
    seasonings: [
      { name: '生抽', amount: '1勺' },
      { name: '糖', amount: '少许' },
      { name: '盐', amount: '少许' }
    ],
    steps: ['茄子切条。', '锅中煎软茄子。', '加入蒜末和调味汁翻炒。', '收汁后撒葱。'],
    tags: ['下饭', '家常', '素菜']
  },
  {
    id: 'r18',
    name: '虾仁炒蛋',
    cover: '/assets/recipes/Shrimp Scrambled Eggs.jpg',
    category: '简餐',
    difficulty: '简单',
    cookTime: 10,
    ingredients: [
      { name: '虾', amount: '150克', required: true },
      { name: '鸡蛋', amount: '2个', required: true },
      { name: '葱', amount: '少许', required: false }
    ],
    seasonings: [
      { name: '盐', amount: '少许' },
      { name: '油', amount: '适量' }
    ],
    steps: ['虾处理干净，鸡蛋打散。', '先炒虾至变色。', '倒入蛋液翻炒成块。', '调味撒葱。'],
    tags: ['高蛋白', '省时', '家常']
  },
  {
    id: 'r19',
    name: '南瓜粥',
    cover: '/assets/recipes/Pumpkin Porridge.jpg',
    category: '主食',
    difficulty: '简单',
    cookTime: 30,
    ingredients: [
      { name: '南瓜', amount: '200克', required: true },
      { name: '大米', amount: '半杯', required: true }
    ],
    seasonings: [
      { name: '糖', amount: '少许' }
    ],
    steps: ['南瓜去皮切块。', '大米洗净加水煮开。', '加入南瓜煮至软烂。', '按喜好加糖。'],
    tags: ['早餐', '暖胃', '轻食']
  },
  {
    id: 'r20',
    name: '葱油面',
    cover: '/assets/recipes/Scallion Oil Noodles.jpg',
    category: '主食',
    difficulty: '简单',
    cookTime: 12,
    ingredients: [
      { name: '面条', amount: '1份', required: true },
      { name: '葱', amount: '适量', required: true }
    ],
    seasonings: [
      { name: '生抽', amount: '2勺' },
      { name: '糖', amount: '少许' },
      { name: '油', amount: '适量' }
    ],
    steps: ['面条煮熟过水。', '葱切段，小火炸出葱油。', '加入生抽和糖调汁。', '面条拌入葱油汁。'],
    tags: ['省时', '主食', '简单']
  },
  {
    id: 'r21',
    name: '蘑菇炒肉',
    cover: '/assets/recipes/Stir-fried Pork with Mushrooms.jpg',
    category: '家常菜',
    difficulty: '简单',
    cookTime: 15,
    ingredients: [
      { name: '蘑菇', amount: '200克', required: true },
      { name: '猪肉', amount: '150克', required: true },
      { name: '蒜', amount: '2瓣', required: false }
    ],
    seasonings: [
      { name: '生抽', amount: '1勺' },
      { name: '盐', amount: '少许' },
      { name: '油', amount: '适量' }
    ],
    steps: ['蘑菇切片，猪肉切片。', '先炒肉片至变色。', '加入蘑菇翻炒出水。', '调味收汁。'],
    tags: ['家常', '下饭', '省时']
  },
  {
    id: 'r22',
    name: '白灼虾',
    cover: '/assets/recipes/Boiled Shrimp.jpg',
    category: '简餐',
    difficulty: '简单',
    cookTime: 10,
    ingredients: [
      { name: '虾', amount: '300克', required: true },
      { name: '姜', amount: '2片', required: false }
    ],
    seasonings: [
      { name: '料酒', amount: '1勺' },
      { name: '生抽', amount: '蘸料' }
    ],
    steps: ['虾洗净处理。', '水中加姜和料酒烧开。', '放入虾煮至变色。', '捞出配蘸料。'],
    tags: ['省时', '高蛋白', '清淡']
  },
  {
    id: 'r23',
    name: '酸奶水果杯',
    cover: '/assets/recipes/Yogurt Fruit Cup.jpg',
    category: '轻食',
    difficulty: '简单',
    cookTime: 6,
    ingredients: [
      { name: '酸奶', amount: '1杯', required: true },
      { name: '苹果', amount: '半个', required: false },
      { name: '香蕉', amount: '半根', required: false },
      { name: '蓝莓', amount: '少许', required: false }
    ],
    seasonings: [
      { name: '蜂蜜', amount: '少许' }
    ],
    steps: ['水果切小块。', '杯中倒入酸奶。', '铺上水果，按喜好加蜂蜜。'],
    tags: ['早餐', '免开火', '轻食']
  },
  {
    id: 'r24',
    name: '番茄鸡蛋面',
    cover: '/assets/recipes/Tomato Egg Noodles.jpg',
    category: '主食',
    difficulty: '简单',
    cookTime: 15,
    ingredients: [
      { name: '面条', amount: '1份', required: true },
      { name: '番茄', amount: '1个', required: true },
      { name: '鸡蛋', amount: '1个', required: true }
    ],
    seasonings: [
      { name: '盐', amount: '少许' },
      { name: '油', amount: '适量' }
    ],
    steps: ['番茄切块，鸡蛋打散。', '炒番茄出汁后加水。', '水开下面条。', '淋入蛋液，调味出锅。'],
    tags: ['主食', '暖胃', '家常']
  }
]

function nowISO() {
  return new Date().toISOString()
}

function read(key, fallback) {
  try {
    const v = wx.getStorageSync(key)
    return v || fallback
  } catch (e) {
    return fallback
  }
}

function write(key, value) {
  wx.setStorageSync(key, value)
}

function getSettings() {
  return {
    ...defaultSettings,
    ...read(SETTINGS_KEY, {})
  }
}

function saveSettings(settings) {
  write(SETTINGS_KEY, {
    ...defaultSettings,
    ...settings
  })
}

function getInventory() {
  const list = read(INVENTORY_KEY, [])
  return list
    .map(item => ({ ...item, status: computeStatus(item) }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

function saveInventoryList(list) {
  write(INVENTORY_KEY, list)
}

function upsertInventory(item) {
  const list = read(INVENTORY_KEY, [])
  let shouldRecordHistory = false
  if (!item.id) {
    item.id = 'i_' + Date.now()
    item.createdAt = nowISO()
    shouldRecordHistory = true
  }
  item.updatedAt = nowISO()
  const idx = list.findIndex(v => v.id === item.id)
  if (idx > -1) list[idx] = item
  else {
    list.push(item)
    shouldRecordHistory = true
  }
  if (shouldRecordHistory) {
    const history = read(HISTORY_KEY, {})
    history[item.name] = (history[item.name] || 0) + 1
    write(HISTORY_KEY, history)
  }
  saveInventoryList(list)
  return item
}

function deleteInventory(id) {
  const list = read(INVENTORY_KEY, []).filter(item => item.id !== id)
  saveInventoryList(list)
}

function updateInventoryStatus(id, mode) {
  const list = read(INVENTORY_KEY, [])
  const idx = list.findIndex(v => v.id === id)
  if (idx === -1) return
  if (mode === 'consumed') {
    list[idx].consumed = true
    list[idx].discarded = false
    list[idx].remainingQuantity = 0
  }
  if (mode === 'discarded') {
    list[idx].discarded = true
    list[idx].consumed = false
    list[idx].remainingQuantity = 0
  }
  list[idx].updatedAt = nowISO()
  saveInventoryList(list)
}

function computeStatus(item) {
  if (item.consumed) return 'consumed'
  if (item.discarded) return 'discarded'
  if (!item.expireDate) return 'in_stock'
  const today = new Date()
  const expire = new Date(item.expireDate + 'T23:59:59')
  const diff = Math.ceil((expire - today) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'expired'
  if (diff <= 3) return 'expiring'
  return 'in_stock'
}

function getStatusText(status) {
  const map = {
    in_stock: '正常',
    expiring: '临期',
    expired: '过期',
    consumed: '已使用',
    discarded: '已丢弃'
  }
  return map[status] || '正常'
}

function normalizeIngredient(name) {
  const text = String(name || '').trim().replace(/\s/g, '')
  return ingredientAliasMap[text] || text
}

function getMainIngredients(recipe) {
  return (recipe.ingredients || []).filter(item => item.required !== false)
}

function getOptionalIngredients(recipe) {
  return (recipe.ingredients || []).filter(item => item.required === false)
}

function getEffortBonus(recipe) {
  let bonus = 0
  if (recipe.difficulty === '简单') bonus += 5
  if (Number(recipe.cookTime) <= 15) bonus += 5
  else if (Number(recipe.cookTime) <= 25) bonus += 2
  return bonus
}

function getRecipeSortIndex(recipe) {
  return Number(String(recipe.id || '').replace(/\D/g, '')) || 0
}

function getRecipeRecommendations() {
  const inventory = getInventory().filter(item => ['in_stock', 'expiring'].includes(item.status))
  const inventoryNames = new Set(inventory.map(item => normalizeIngredient(item.name)))
  const expiringNames = new Set(
    inventory
      .filter(item => item.status === 'expiring')
      .map(item => normalizeIngredient(item.name))
  )

  return builtinRecipes.map(recipe => {
    const mainIngredients = getMainIngredients(recipe)
    const optionalIngredients = getOptionalIngredients(recipe)
    const matched = mainIngredients.filter(item => inventoryNames.has(normalizeIngredient(item.name)))
    const missing = mainIngredients.filter(item => !inventoryNames.has(normalizeIngredient(item.name)))
    const matchedOptional = optionalIngredients.filter(item => inventoryNames.has(normalizeIngredient(item.name)))
    const missingOptional = optionalIngredients.filter(item => !inventoryNames.has(normalizeIngredient(item.name)))
    const missingSeasonings = (recipe.seasonings || []).filter(item => !inventoryNames.has(normalizeIngredient(item.name)))
    const expiringMatched = mainIngredients.filter(item => expiringNames.has(normalizeIngredient(item.name)))

    const totalCount = mainIngredients.length
    const matchedCount = matched.length
    const baseMatchRate = totalCount ? Math.round((matchedCount / totalCount) * 100) : 0
    const expiringBonus = expiringMatched.length ? Math.min(20, expiringMatched.length * 10) : 0
    const missingPenalty = missing.length > 1 ? (missing.length - 1) * 8 : 0
    const score = Math.max(0, Math.min(100, Math.round(baseMatchRate + expiringBonus + getEffortBonus(recipe) - missingPenalty)))

    return {
      ...recipe,
      matched,
      missing,
      matchedOptional,
      missingOptional,
      missingSeasonings,
      expiringMatched,
      baseMatchRate,
      matchRate: baseMatchRate,
      score,
      sortIndex: getRecipeSortIndex(recipe),
      matchSummary: `${matchedCount}/${totalCount}`
    }
  }).sort((a, b) => b.score - a.score || a.cookTime - b.cookTime || a.sortIndex - b.sortIndex)
}

function formatQuantityText(quantity) {
  const number = Number(quantity)
  if (!Number.isFinite(number)) return '0'
  return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(2)))
}

function getAvailableQuantity(item) {
  if (!['in_stock', 'expiring'].includes(item.status)) return 0
  const quantity = item.remainingQuantity !== undefined && item.remainingQuantity !== ''
    ? Number(item.remainingQuantity)
    : Number(item.quantity)
  return Number.isFinite(quantity) ? quantity : 0
}

function getPurchaseSuggestions() {
  const history = read(HISTORY_KEY, {})
  const inventory = getInventory()
  const historyMap = Object.keys(history).reduce((map, name) => {
    const key = normalizeIngredient(name)
    if (!key) return map
    if (!map[key]) {
      map[key] = {
        key,
        name,
        count: 0
      }
    }
    map[key].count += Number(history[name]) || 0
    return map
  }, {})

  const stockMap = inventory.reduce((map, item) => {
    const key = normalizeIngredient(item.name)
    if (!key) return map
    if (!map[key]) {
      map[key] = {
        quantity: 0,
        units: new Set(),
        category: ''
      }
    }
    const quantity = getAvailableQuantity(item)
    map[key].quantity += quantity
    if (quantity > 0 && item.unit) map[key].units.add(item.unit)
    if (!map[key].category && item.category) map[key].category = item.category
    return map
  }, {})

  return Object.keys(historyMap)
    .map(key => {
      const historyItem = historyMap[key]
      const stockItem = stockMap[key] || { quantity: 0, units: new Set() }
      const currentQuantity = stockItem.quantity
      const units = Array.from(stockItem.units)
      const quantityText = currentQuantity > 0
        ? `${formatQuantityText(currentQuantity)}${units.length === 1 ? units[0] : ''}`
        : '0'
      const urgency = currentQuantity <= 0 ? 'urgent' : 'low'

      return {
        key,
        dismissKey: `${key}_${urgency}_${quantityText}`,
        name: historyItem.name,
        category: stockItem.category || '',
        historyCount: historyItem.count,
        currentQuantity,
        quantityText,
        urgency,
        tagText: urgency === 'urgent' ? '紧急补充' : '建议补充',
        reason: urgency === 'urgent'
          ? `历史录入 ${historyItem.count} 次，当前库存为 0`
          : `历史录入 ${historyItem.count} 次，当前仅剩 ${quantityText}`
      }
    })
    .filter(item => item.historyCount >= 2 && item.currentQuantity <= 1)
    .sort((a, b) => {
      if (a.urgency !== b.urgency) return a.urgency === 'urgent' ? -1 : 1
      return b.historyCount - a.historyCount || a.currentQuantity - b.currentQuantity || a.name.localeCompare(b.name, 'zh-Hans-CN')
    })
    .slice(0, 8)
}

function getReminderSummary() {
  const inventory = getInventory()
  const expiring = inventory.filter(item => item.status === 'expiring')
  const expired = inventory.filter(item => item.status === 'expired')
  return { expiring, expired }
}

function getWeekStart(date) {
  const current = new Date(date)
  const day = current.getDay() || 7
  current.setHours(0, 0, 0, 0)
  current.setDate(current.getDate() - day + 1)
  return current
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function parseStoredDate(value, endOfDay) {
  if (!value) return null
  const date = new Date(String(value).includes('T') ? value : `${value}T${endOfDay ? '23:59:59' : '00:00:00'}`)
  return Number.isNaN(date.getTime()) ? null : date
}

function isDateInRange(value, start, end, endOfDay) {
  const date = parseStoredDate(value, endOfDay)
  return !!date && date >= start && date < end
}

function getTrend(current, previous, inverse) {
  const rawDiff = current - previous
  const scoreDiff = inverse ? -rawDiff : rawDiff
  const absDiff = Math.abs(rawDiff)
  if (absDiff === 0) {
    return {
      text: '持平 0%',
      className: 'neutral'
    }
  }

  const arrow = rawDiff > 0 ? '↑' : '↓'
  const sign = rawDiff > 0 ? '+' : '-'
  return {
    text: `${arrow} ${sign}${absDiff}%`,
    className: scoreDiff > 0 ? 'positive' : 'negative'
  }
}

function getActionRate(used, expired, discarded) {
  const total = used + expired + discarded
  return total ? Math.round((used / total) * 100) : 0
}

function getWasteRate(expired, discarded, used) {
  const total = used + expired + discarded
  return total ? Math.round(((expired + discarded) / total) * 100) : 0
}

function getStats() {
  const list = getInventory()
  const total = list.length
  const used = list.filter(item => item.consumed).length
  const discarded = list.filter(item => item.discarded).length
  const expired = list.filter(item => item.status === 'expired').length
  const handled = list.filter(item => item.status === 'consumed' || item.status === 'discarded').length
  const reminderTargets = list.filter(item => ['expiring', 'expired', 'consumed', 'discarded'].includes(item.status)).length
  const wasteRate = total ? Math.round(((expired + discarded) / total) * 100) : 0

  const weekStart = getWeekStart(new Date())
  const nextWeekStart = addDays(weekStart, 7)
  const previousWeekStart = addDays(weekStart, -7)

  const addedThisWeek = list.filter(item => isDateInRange(item.createdAt, weekStart, nextWeekStart)).length
  const usedThisWeek = list.filter(item => item.consumed && isDateInRange(item.updatedAt, weekStart, nextWeekStart)).length
  const expiredThisWeek = list.filter(item => item.status === 'expired' && isDateInRange(item.expireDate, weekStart, nextWeekStart, true)).length
  const discardedThisWeek = list.filter(item => item.discarded && isDateInRange(item.updatedAt, weekStart, nextWeekStart)).length

  const previousUsed = list.filter(item => item.consumed && isDateInRange(item.updatedAt, previousWeekStart, weekStart)).length
  const previousExpired = list.filter(item => item.status === 'expired' && isDateInRange(item.expireDate, previousWeekStart, weekStart, true)).length
  const previousDiscarded = list.filter(item => item.discarded && isDateInRange(item.updatedAt, previousWeekStart, weekStart)).length

  const weeklyWasteRate = getWasteRate(expiredThisWeek, discardedThisWeek, usedThisWeek)
  const previousWasteRate = getWasteRate(previousExpired, previousDiscarded, previousUsed)
  const weeklyUtilizationRate = getActionRate(usedThisWeek, expiredThisWeek, discardedThisWeek)
  const previousUtilizationRate = getActionRate(previousUsed, previousExpired, previousDiscarded)
  const weeklyReminderHandleRate = (usedThisWeek + discardedThisWeek + expiredThisWeek)
    ? Math.round(((usedThisWeek + discardedThisWeek) / (usedThisWeek + discardedThisWeek + expiredThisWeek)) * 100)
    : 0
  const previousReminderHandleRate = (previousUsed + previousDiscarded + previousExpired)
    ? Math.round(((previousUsed + previousDiscarded) / (previousUsed + previousDiscarded + previousExpired)) * 100)
    : 0

  return {
    total,
    used,
    expired,
    discarded,
    utilizationRate: total ? Math.round((used / total) * 100) : 0,
    reminderHandleRate: reminderTargets ? Math.round((handled / reminderTargets) * 100) : 0,
    wasteRate,
    wasteControlRate: Math.max(0, 100 - wasteRate),
    weekly: {
      added: addedThisWeek,
      used: usedThisWeek,
      expired: expiredThisWeek,
      discarded: discardedThisWeek,
      wasteRate: weeklyWasteRate
    },
    trends: {
      utilization: getTrend(weeklyUtilizationRate, previousUtilizationRate),
      reminder: getTrend(weeklyReminderHandleRate, previousReminderHandleRate),
      waste: getTrend(weeklyWasteRate, previousWasteRate, true)
    }
  }
}

function getCategories() {
  return ['蔬菜', '肉类', '海鲜', '蛋奶', '水果', '主食', '调料', '其他']
}

module.exports = {
  getSettings,
  saveSettings,
  getInventory,
  upsertInventory,
  deleteInventory,
  updateInventoryStatus,
  getStatusText,
  getRecipeRecommendations,
  getPurchaseSuggestions,
  getReminderSummary,
  getStats,
  getCategories
}
