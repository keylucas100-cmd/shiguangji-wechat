const INVENTORY_KEY = "sgj_inventory";
const SETTINGS_KEY = "sgj_settings";
const HISTORY_KEY = "sgj_history";
// Backend mode: change the port to an unavailable one only when forcing local-cache fallback for demos.
const INVENTORY_API_URL = "http://127.0.0.1:3000/api/inventory-records";
const USERS_API_URL = "http://127.0.0.1:3000/api/users";
const INGREDIENTS_API_URL = "http://127.0.0.1:3000/api/ingredients";
const LOCAL_USER_OPENID = "wx_localstyles_demo_user";
const DEFAULT_INVENTORY_USER_ID = 1;
const LOCAL_INVENTORY_ID_PREFIX = "local_";

let inventorySyncPromise = null;
let currentUserPromise = null;

const defaultSettings = {
  userName: "Lucas",
  elderlyMode: false,
  voiceBroadcast: true,
  themeKey: "green",
};

const CATEGORY_WARNING_RULES = {
  蔬菜: { lowRiskDays: 4, mediumRiskDays: 2, highRiskDays: 1 },
  肉类: { lowRiskDays: 5, mediumRiskDays: 3, highRiskDays: 1 },
  海鲜: { lowRiskDays: 3, mediumRiskDays: 2, highRiskDays: 1 },
  蛋奶: { lowRiskDays: 6, mediumRiskDays: 3, highRiskDays: 1 },
  水果: { lowRiskDays: 5, mediumRiskDays: 3, highRiskDays: 1 },
  主食: { lowRiskDays: 7, mediumRiskDays: 4, highRiskDays: 1 },
  调料: { lowRiskDays: 15, mediumRiskDays: 7, highRiskDays: 2 },
  其他: { lowRiskDays: 7, mediumRiskDays: 4, highRiskDays: 1 },
};

const EXPIRING_STATUSES = ["low_risk", "medium_risk", "high_risk"];
const ACTIVE_INVENTORY_STATUSES = ["in_stock", ...EXPIRING_STATUSES];

const ingredientAliasMap = {
  西红柿: "番茄",
  马铃薯: "土豆",
  洋芋: "土豆",
  鸡子: "鸡蛋",
  花椰菜: "西兰花",
  青菜: "生菜",
  小葱: "葱",
  大葱: "葱",
  蒜头: "蒜",
  蒜米: "蒜",
  番薯: "红薯",
  牛腩: "牛肉",
  肥牛: "牛肉",
  牛排: "牛肉",
  五花肉: "猪肉",
  里脊肉: "猪肉",
  肉末: "猪肉",
  鸡胸肉: "鸡肉",
  鸡腿: "鸡肉",
  鸡翅: "鸡肉",
  虾仁: "虾",
  虾滑: "虾",
};

const builtinRecipes = [
  {
    id: "r1",
    name: "番茄炒蛋",
    cover: "/assets/recipes/tomato-egg.jpg",
    category: "家常菜",
    difficulty: "简单",
    cookTime: 10,
    ingredients: [
      { name: "番茄", amount: "2个", required: true },
      { name: "鸡蛋", amount: "3个", required: true },
      { name: "葱", amount: "少许", required: false },
    ],
    seasonings: [
      { name: "盐", amount: "少许" },
      { name: "油", amount: "适量" },
    ],
    steps: [
      "番茄切块，鸡蛋打散。",
      "先炒鸡蛋后盛出。",
      "下番茄翻炒出汁，再倒回鸡蛋。",
      "加盐调味，撒葱出锅。",
    ],
    tags: ["下饭", "省时", "家常"],
  },
  {
    id: "r2",
    name: "青椒炒肉",
    cover: "/assets/recipes/pepper-pork.jpg",
    category: "家常菜",
    difficulty: "简单",
    cookTime: 15,
    ingredients: [
      { name: "青椒", amount: "2个", required: true },
      { name: "猪肉", amount: "200克", required: true },
      { name: "蒜", amount: "2瓣", required: false },
    ],
    seasonings: [
      { name: "生抽", amount: "1勺" },
      { name: "盐", amount: "少许" },
      { name: "油", amount: "适量" },
    ],
    steps: [
      "猪肉切片，用生抽抓匀。",
      "青椒切块，蒜切末。",
      "热锅炒肉片至变色。",
      "加入青椒和蒜末翻炒，调味出锅。",
    ],
    tags: ["下饭", "家常", "省时"],
  },
  {
    id: "r3",
    name: "西兰花虾仁",
    cover: "/assets/recipes/shrimp-broccoli.jpg",
    category: "轻食",
    difficulty: "简单",
    cookTime: 12,
    ingredients: [
      { name: "西兰花", amount: "1颗", required: true },
      { name: "虾", amount: "150克", required: true },
      { name: "蒜", amount: "2瓣", required: false },
    ],
    seasonings: [
      { name: "盐", amount: "少许" },
      { name: "油", amount: "适量" },
    ],
    steps: [
      "西兰花切小朵焯水。",
      "虾处理干净，蒜切末。",
      "热锅爆香蒜末，下虾炒至变色。",
      "加入西兰花翻炒，调味后出锅。",
    ],
    tags: ["轻食", "高蛋白", "省时"],
  },
  {
    id: "r4",
    name: "牛奶燕麦杯",
    cover: "/assets/recipes/milk-oat.jpg",
    category: "早餐",
    difficulty: "简单",
    cookTime: 5,
    ingredients: [
      { name: "牛奶", amount: "200毫升", required: true },
      { name: "燕麦", amount: "40克", required: true },
      { name: "香蕉", amount: "1根", required: false },
    ],
    seasonings: [{ name: "蜂蜜", amount: "少许" }],
    steps: ["杯中加入燕麦和牛奶。", "香蕉切片铺在表面。", "按喜好加少许蜂蜜。"],
    tags: ["早餐", "免开火", "轻食"],
  },
  {
    id: "r5",
    name: "土豆炖牛肉",
    cover: "/assets/recipes/braised-beef-potato.jpg",
    category: "家常菜",
    difficulty: "中等",
    cookTime: 45,
    ingredients: [
      { name: "牛肉", amount: "300克", required: true },
      { name: "土豆", amount: "2个", required: true },
      { name: "胡萝卜", amount: "1根", required: false },
    ],
    seasonings: [
      { name: "生抽", amount: "2勺" },
      { name: "老抽", amount: "半勺" },
      { name: "盐", amount: "少许" },
    ],
    steps: [
      "牛肉切块焯水。",
      "土豆和胡萝卜切块。",
      "牛肉加调料炖煮30分钟。",
      "加入土豆继续炖至软烂。",
    ],
    tags: ["炖菜", "下饭", "家常"],
  },
  {
    id: "r6",
    name: "黄瓜炒蛋",
    cover: "/assets/recipes/cucumber-eggs.jpg",
    category: "简餐",
    difficulty: "简单",
    cookTime: 10,
    ingredients: [
      { name: "黄瓜", amount: "1根", required: true },
      { name: "鸡蛋", amount: "2个", required: true },
    ],
    seasonings: [
      { name: "盐", amount: "少许" },
      { name: "油", amount: "适量" },
    ],
    steps: [
      "黄瓜切片，鸡蛋打散。",
      "先炒鸡蛋盛出。",
      "下黄瓜快速翻炒。",
      "倒回鸡蛋，调味出锅。",
    ],
    tags: ["省时", "清爽", "家常"],
  },
  {
    id: "r7",
    name: "紫菜蛋花汤",
    cover: "/assets/recipes/seaweed-egg-soup.jpg",
    category: "汤类",
    difficulty: "简单",
    cookTime: 8,
    ingredients: [
      { name: "鸡蛋", amount: "1个", required: true },
      { name: "紫菜", amount: "少许", required: true },
      { name: "葱", amount: "少许", required: false },
    ],
    seasonings: [
      { name: "盐", amount: "少许" },
      { name: "香油", amount: "几滴" },
    ],
    steps: [
      "水烧开后放入紫菜。",
      "鸡蛋打散淋入锅中。",
      "加盐调味，撒葱花。",
      "出锅前滴香油。",
    ],
    tags: ["汤", "省时", "清淡"],
  },
  {
    id: "r8",
    name: "冬瓜排骨汤",
    cover: "/assets/recipes/winter-melon-pork-soup.jpg",
    category: "汤类",
    difficulty: "中等",
    cookTime: 50,
    ingredients: [
      { name: "冬瓜", amount: "300克", required: true },
      { name: "排骨", amount: "300克", required: true },
      { name: "姜", amount: "2片", required: false },
    ],
    seasonings: [
      { name: "盐", amount: "少许" },
      { name: "料酒", amount: "1勺" },
    ],
    steps: [
      "排骨焯水洗净。",
      "冬瓜切块，姜切片。",
      "排骨加水炖40分钟。",
      "加入冬瓜煮熟，调味即可。",
    ],
    tags: ["汤", "清爽", "家常"],
  },
  {
    id: "r9",
    name: "番茄牛腩汤",
    cover: "/assets/recipes/tomato-beef-soup.jpg",
    category: "汤类",
    difficulty: "中等",
    cookTime: 55,
    ingredients: [
      { name: "番茄", amount: "2个", required: true },
      { name: "牛肉", amount: "300克", required: true },
      { name: "土豆", amount: "1个", required: false },
    ],
    seasonings: [
      { name: "盐", amount: "少许" },
      { name: "生抽", amount: "1勺" },
    ],
    steps: [
      "牛肉切块焯水。",
      "番茄切块炒出汁。",
      "加入牛肉和清水炖煮。",
      "出锅前调味。",
    ],
    tags: ["汤", "暖胃", "家常"],
  },
  {
    id: "r10",
    name: "香菇鸡肉粥",
    cover: "/assets/recipes/chicken-mushroom-congee.jpg",
    category: "主食",
    difficulty: "简单",
    cookTime: 30,
    ingredients: [
      { name: "大米", amount: "半杯", required: true },
      { name: "鸡肉", amount: "120克", required: true },
      { name: "香菇", amount: "3朵", required: true },
    ],
    seasonings: [
      { name: "盐", amount: "少许" },
      { name: "姜", amount: "少许" },
    ],
    steps: [
      "大米洗净煮粥。",
      "鸡肉切丝，香菇切片。",
      "粥煮开后加入鸡肉和香菇。",
      "煮至浓稠后调味。",
    ],
    tags: ["早餐", "暖胃", "轻食"],
  },
  {
    id: "r11",
    name: "鸡蛋三明治",
    cover: "/assets/recipes/egg-sandwich.jpg",
    category: "早餐",
    difficulty: "简单",
    cookTime: 10,
    ingredients: [
      { name: "面包", amount: "2片", required: true },
      { name: "鸡蛋", amount: "1个", required: true },
      { name: "生菜", amount: "2片", required: false },
    ],
    seasonings: [{ name: "沙拉酱", amount: "适量" }],
    steps: ["鸡蛋煎熟。", "面包片加热。", "夹入生菜、鸡蛋和沙拉酱。"],
    tags: ["早餐", "省时", "便当"],
  },
  {
    id: "r12",
    name: "香蕉酸奶杯",
    cover: "/assets/recipes/banana-yogurt--cup.jpg",
    category: "早餐",
    difficulty: "简单",
    cookTime: 5,
    ingredients: [
      { name: "香蕉", amount: "1根", required: true },
      { name: "酸奶", amount: "1杯", required: true },
      { name: "燕麦", amount: "少许", required: false },
    ],
    seasonings: [{ name: "蜂蜜", amount: "少许" }],
    steps: ["香蕉切片。", "杯中倒入酸奶。", "加入香蕉和燕麦。"],
    tags: ["早餐", "免开火", "轻食"],
  },
  {
    id: "r13",
    name: "蔬菜沙拉",
    cover: "/assets/recipes/vegetable-salad.jpg",
    category: "轻食",
    difficulty: "简单",
    cookTime: 8,
    ingredients: [
      { name: "生菜", amount: "适量", required: true },
      { name: "黄瓜", amount: "半根", required: true },
      { name: "番茄", amount: "1个", required: false },
    ],
    seasonings: [
      { name: "沙拉酱", amount: "适量" },
      { name: "盐", amount: "少许" },
    ],
    steps: ["蔬菜洗净沥干。", "黄瓜和番茄切块。", "加入沙拉酱拌匀。"],
    tags: ["轻食", "清爽", "免开火"],
  },
  {
    id: "r14",
    name: "煎鸡胸肉",
    cover: "/assets/recipes/grilled-chicken-breast.jpg",
    category: "轻食",
    difficulty: "简单",
    cookTime: 15,
    ingredients: [
      { name: "鸡肉", amount: "200克", required: true },
      { name: "生菜", amount: "适量", required: false },
    ],
    seasonings: [
      { name: "盐", amount: "少许" },
      { name: "黑胡椒", amount: "少许" },
      { name: "油", amount: "少许" },
    ],
    steps: ["鸡肉用盐和黑胡椒腌制。", "平底锅少油加热。", "两面煎至金黄熟透。"],
    tags: ["高蛋白", "省时", "轻食"],
  },
  {
    id: "r15",
    name: "青椒土豆丝",
    cover: "/assets/recipes/Stir-friedShreddedPotatowithGreenPepper.jpg",
    category: "家常菜",
    difficulty: "简单",
    cookTime: 12,
    ingredients: [
      { name: "青椒", amount: "1个", required: true },
      { name: "土豆", amount: "2个", required: true },
    ],
    seasonings: [
      { name: "盐", amount: "少许" },
      { name: "醋", amount: "少许" },
      { name: "油", amount: "适量" },
    ],
    steps: [
      "土豆切丝泡水。",
      "青椒切丝。",
      "热锅下土豆丝翻炒。",
      "加入青椒和调料炒匀。",
    ],
    tags: ["家常", "下饭", "素菜"],
  },
  {
    id: "r16",
    name: "蒜蓉生菜",
    cover: "/assets/recipes/Garlic Lettuce Stir-fry.jpg",
    category: "简餐",
    difficulty: "简单",
    cookTime: 8,
    ingredients: [
      { name: "生菜", amount: "1颗", required: true },
      { name: "蒜", amount: "3瓣", required: false },
    ],
    seasonings: [
      { name: "盐", amount: "少许" },
      { name: "生抽", amount: "1勺" },
      { name: "油", amount: "适量" },
    ],
    steps: [
      "生菜洗净沥干。",
      "蒜切末。",
      "爆香蒜末后下生菜快炒。",
      "调味出锅。",
    ],
    tags: ["省时", "素菜", "清爽"],
  },
  {
    id: "r17",
    name: "红烧茄子",
    cover: "/assets/recipes/Braised Eggplant.jpg",
    category: "家常菜",
    difficulty: "中等",
    cookTime: 20,
    ingredients: [
      { name: "茄子", amount: "2根", required: true },
      { name: "蒜", amount: "2瓣", required: false },
      { name: "葱", amount: "少许", required: false },
    ],
    seasonings: [
      { name: "生抽", amount: "1勺" },
      { name: "糖", amount: "少许" },
      { name: "盐", amount: "少许" },
    ],
    steps: [
      "茄子切条。",
      "锅中煎软茄子。",
      "加入蒜末和调味汁翻炒。",
      "收汁后撒葱。",
    ],
    tags: ["下饭", "家常", "素菜"],
  },
  {
    id: "r18",
    name: "虾仁炒蛋",
    cover: "/assets/recipes/Shrimp Scrambled Eggs.jpg",
    category: "简餐",
    difficulty: "简单",
    cookTime: 10,
    ingredients: [
      { name: "虾", amount: "150克", required: true },
      { name: "鸡蛋", amount: "2个", required: true },
      { name: "葱", amount: "少许", required: false },
    ],
    seasonings: [
      { name: "盐", amount: "少许" },
      { name: "油", amount: "适量" },
    ],
    steps: [
      "虾处理干净，鸡蛋打散。",
      "先炒虾至变色。",
      "倒入蛋液翻炒成块。",
      "调味撒葱。",
    ],
    tags: ["高蛋白", "省时", "家常"],
  },
  {
    id: "r19",
    name: "南瓜粥",
    cover: "/assets/recipes/Pumpkin Porridge.jpg",
    category: "主食",
    difficulty: "简单",
    cookTime: 30,
    ingredients: [
      { name: "南瓜", amount: "200克", required: true },
      { name: "大米", amount: "半杯", required: true },
    ],
    seasonings: [{ name: "糖", amount: "少许" }],
    steps: [
      "南瓜去皮切块。",
      "大米洗净加水煮开。",
      "加入南瓜煮至软烂。",
      "按喜好加糖。",
    ],
    tags: ["早餐", "暖胃", "轻食"],
  },
  {
    id: "r20",
    name: "葱油面",
    cover: "/assets/recipes/Scallion Oil Noodles.jpg",
    category: "主食",
    difficulty: "简单",
    cookTime: 12,
    ingredients: [
      { name: "面条", amount: "1份", required: true },
      { name: "葱", amount: "适量", required: true },
    ],
    seasonings: [
      { name: "生抽", amount: "2勺" },
      { name: "糖", amount: "少许" },
      { name: "油", amount: "适量" },
    ],
    steps: [
      "面条煮熟过水。",
      "葱切段，小火炸出葱油。",
      "加入生抽和糖调汁。",
      "面条拌入葱油汁。",
    ],
    tags: ["省时", "主食", "简单"],
  },
  {
    id: "r21",
    name: "蘑菇炒肉",
    cover: "/assets/recipes/Stir-fried Pork with Mushrooms.jpg",
    category: "家常菜",
    difficulty: "简单",
    cookTime: 15,
    ingredients: [
      { name: "蘑菇", amount: "200克", required: true },
      { name: "猪肉", amount: "150克", required: true },
      { name: "蒜", amount: "2瓣", required: false },
    ],
    seasonings: [
      { name: "生抽", amount: "1勺" },
      { name: "盐", amount: "少许" },
      { name: "油", amount: "适量" },
    ],
    steps: [
      "蘑菇切片，猪肉切片。",
      "先炒肉片至变色。",
      "加入蘑菇翻炒出水。",
      "调味收汁。",
    ],
    tags: ["家常", "下饭", "省时"],
  },
  {
    id: "r22",
    name: "白灼虾",
    cover: "/assets/recipes/Boiled Shrimp.jpg",
    category: "简餐",
    difficulty: "简单",
    cookTime: 10,
    ingredients: [
      { name: "虾", amount: "300克", required: true },
      { name: "姜", amount: "2片", required: false },
    ],
    seasonings: [
      { name: "料酒", amount: "1勺" },
      { name: "生抽", amount: "蘸料" },
    ],
    steps: [
      "虾洗净处理。",
      "水中加姜和料酒烧开。",
      "放入虾煮至变色。",
      "捞出配蘸料。",
    ],
    tags: ["省时", "高蛋白", "清淡"],
  },
  {
    id: "r23",
    name: "酸奶水果杯",
    cover: "/assets/recipes/Yogurt Fruit Cup.jpg",
    category: "轻食",
    difficulty: "简单",
    cookTime: 6,
    ingredients: [
      { name: "酸奶", amount: "1杯", required: true },
      { name: "苹果", amount: "半个", required: false },
      { name: "香蕉", amount: "半根", required: false },
      { name: "蓝莓", amount: "少许", required: false },
    ],
    seasonings: [{ name: "蜂蜜", amount: "少许" }],
    steps: ["水果切小块。", "杯中倒入酸奶。", "铺上水果，按喜好加蜂蜜。"],
    tags: ["早餐", "免开火", "轻食"],
  },
  {
    id: "r24",
    name: "番茄鸡蛋面",
    cover: "/assets/recipes/Tomato Egg Noodles.jpg",
    category: "主食",
    difficulty: "简单",
    cookTime: 15,
    ingredients: [
      { name: "面条", amount: "1份", required: true },
      { name: "番茄", amount: "1个", required: true },
      { name: "鸡蛋", amount: "1个", required: true },
    ],
    seasonings: [
      { name: "盐", amount: "少许" },
      { name: "油", amount: "适量" },
    ],
    steps: [
      "番茄切块，鸡蛋打散。",
      "炒番茄出汁后加水。",
      "水开下面条。",
      "淋入蛋液，调味出锅。",
    ],
    tags: ["主食", "暖胃", "家常"],
  },
];

function nowISO() {
  return new Date().toISOString();
}

function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      success: resolve,
      fail: reject,
    });
  });
}

function getResponseErrorMessage(res) {
  const payload = res && res.data;
  if (payload && typeof payload === "object" && payload.message)
    return payload.message;
  if (typeof payload === "string" && payload) return payload;
  return "";
}

function requestJson(options) {
  return request(options).then((res) => {
    if (res.statusCode >= 200 && res.statusCode < 300) return res.data;

    const error = new Error(
      getResponseErrorMessage(res) ||
        `Request failed with status ${res.statusCode}`,
    );
    error.statusCode = res.statusCode;
    throw error;
  });
}

function shouldUseLocalInventoryFallback(error) {
  return !error || !error.statusCode;
}

function formatLocalDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function parsePositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function parseOptionalDate(value) {
  const text = String(value || "").trim();
  return text || null;
}

function getBackendPurchaseDate(item, existingItem) {
  // The UI treats purchase date as optional, but the current backend requires it.
  return (
    parseOptionalDate(item.purchaseDate) ||
    parseOptionalDate(existingItem && existingItem.purchaseDate) ||
    formatLocalDate(new Date())
  );
}

function getBackendProductionDate(item, existingItem) {
  // The UI allows using expire date directly, while the current backend still requires production date.
  return (
    parseOptionalDate(item.productionDate) ||
    parseOptionalDate(existingItem && existingItem.productionDate) ||
    parseOptionalDate(item.purchaseDate) ||
    parseOptionalDate(existingItem && existingItem.purchaseDate) ||
    formatLocalDate(new Date())
  );
}

function getDateDiffDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;

  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
}

function getBackendShelfLifeDays(item, existingItem) {
  // The UI lets users provide expire date directly, but the backend requires shelf life.
  const explicitDays =
    parsePositiveInteger(item.shelfLifeDays) ||
    parsePositiveInteger(existingItem && existingItem.shelfLifeDays);
  if (explicitDays) return explicitDays;

  const expireDate =
    parseOptionalDate(item.expireDate) ||
    parseOptionalDate(existingItem && existingItem.expireDate);
  if (!expireDate) return 1;

  return getDateDiffDays(getBackendProductionDate(item, existingItem), expireDate);
}

function formatDateTimeForSql(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function makeIngredientCode() {
  return `ING_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function makeLocalInventoryId() {
  return `${LOCAL_INVENTORY_ID_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function addDaysToLocalDate(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return formatLocalDate(next);
}

function createDemoInventoryList() {
  const today = new Date();
  const yesterday = addDaysToLocalDate(today, -1);
  const twoDaysAgo = addDaysToLocalDate(today, -2);
  const threeDaysAgo = addDaysToLocalDate(today, -3);
  const todayText = formatLocalDate(today);
  const tomorrow = addDaysToLocalDate(today, 1);
  const inTwoDays = addDaysToLocalDate(today, 2);
  const inFourDays = addDaysToLocalDate(today, 4);
  const inSevenDays = addDaysToLocalDate(today, 7);
  const createdAt = nowISO();

  return [
    {
      id: "demo_egg",
      name: "鸡蛋",
      category: "蛋奶",
      quantity: 1,
      unit: "个",
      purchaseDate: twoDaysAgo,
      productionDate: twoDaysAgo,
      shelfLifeDays: 4,
      lowRiskDays: 6,
      mediumRiskDays: 3,
      highRiskDays: 1,
      expireDate: inTwoDays,
      remainingQuantity: 1,
      consumedQuantity: 0,
      discardedQuantity: 0,
      createdAt,
      updatedAt: createdAt,
      localOnly: true,
      demo: true,
    },
    {
      id: "demo_cucumber",
      name: "黄瓜",
      category: "蔬菜",
      quantity: 3,
      unit: "根",
      purchaseDate: threeDaysAgo,
      productionDate: threeDaysAgo,
      shelfLifeDays: 4,
      lowRiskDays: 4,
      mediumRiskDays: 2,
      highRiskDays: 1,
      expireDate: tomorrow,
      remainingQuantity: 3,
      consumedQuantity: 0,
      discardedQuantity: 0,
      createdAt,
      updatedAt: createdAt,
      localOnly: true,
      demo: true,
    },
    {
      id: "demo_shrimp",
      name: "虾",
      category: "海鲜",
      quantity: 300,
      unit: "克",
      purchaseDate: yesterday,
      productionDate: yesterday,
      shelfLifeDays: 3,
      lowRiskDays: 3,
      mediumRiskDays: 2,
      highRiskDays: 1,
      expireDate: inTwoDays,
      remainingQuantity: 300,
      consumedQuantity: 0,
      discardedQuantity: 0,
      createdAt,
      updatedAt: createdAt,
      localOnly: true,
      demo: true,
    },
    {
      id: "demo_egg_used",
      name: "鸡蛋",
      category: "蛋奶",
      quantity: 4,
      unit: "个",
      purchaseDate: threeDaysAgo,
      productionDate: threeDaysAgo,
      shelfLifeDays: 4,
      lowRiskDays: 6,
      mediumRiskDays: 3,
      highRiskDays: 1,
      expireDate: tomorrow,
      remainingQuantity: 0,
      consumedQuantity: 4,
      discardedQuantity: 0,
      consumed: true,
      createdAt,
      updatedAt: createdAt,
      localOnly: true,
      demo: true,
    },
    {
      id: "demo_beef_used",
      name: "牛肉",
      category: "肉类",
      quantity: 1,
      unit: "斤",
      purchaseDate: twoDaysAgo,
      productionDate: twoDaysAgo,
      shelfLifeDays: 4,
      lowRiskDays: 5,
      mediumRiskDays: 3,
      highRiskDays: 1,
      expireDate: inTwoDays,
      remainingQuantity: 0,
      consumedQuantity: 1,
      discardedQuantity: 0,
      consumed: true,
      createdAt,
      updatedAt: createdAt,
      localOnly: true,
      demo: true,
    },
    {
      id: "demo_green_veg_used",
      name: "青菜",
      category: "蔬菜",
      quantity: 2,
      unit: "把",
      purchaseDate: threeDaysAgo,
      productionDate: threeDaysAgo,
      shelfLifeDays: 3,
      lowRiskDays: 4,
      mediumRiskDays: 2,
      highRiskDays: 1,
      expireDate: todayText,
      remainingQuantity: 0,
      consumedQuantity: 2,
      discardedQuantity: 0,
      consumed: true,
      createdAt,
      updatedAt: createdAt,
      localOnly: true,
      demo: true,
    },
    {
      id: "demo_green_veg_low_stock",
      name: "青菜",
      category: "蔬菜",
      quantity: 1,
      unit: "把",
      purchaseDate: todayText,
      productionDate: todayText,
      shelfLifeDays: 3,
      lowRiskDays: 4,
      mediumRiskDays: 2,
      highRiskDays: 1,
      expireDate: inTwoDays,
      remainingQuantity: 1,
      consumedQuantity: 0,
      discardedQuantity: 0,
      createdAt,
      updatedAt: createdAt,
      localOnly: true,
      demo: true,
    },
    {
      id: "demo_beef",
      name: "牛肉",
      category: "肉类",
      quantity: 1,
      unit: "斤",
      purchaseDate: todayText,
      productionDate: todayText,
      shelfLifeDays: 4,
      lowRiskDays: 5,
      mediumRiskDays: 3,
      highRiskDays: 1,
      expireDate: inFourDays,
      remainingQuantity: 1,
      consumedQuantity: 0,
      discardedQuantity: 0,
      createdAt,
      updatedAt: createdAt,
      localOnly: true,
      demo: true,
    },
    {
      id: "demo_tofu_high_risk",
      name: "豆腐",
      category: "蛋奶",
      quantity: 1,
      unit: "盒",
      purchaseDate: yesterday,
      productionDate: yesterday,
      shelfLifeDays: 1,
      lowRiskDays: 6,
      mediumRiskDays: 3,
      highRiskDays: 1,
      expireDate: todayText,
      remainingQuantity: 1,
      consumedQuantity: 0,
      discardedQuantity: 0,
      createdAt,
      updatedAt: createdAt,
      localOnly: true,
      demo: true,
    },
    {
      id: "demo_chicken_high_risk",
      name: "鸡胸肉",
      category: "肉类",
      quantity: 2,
      unit: "块",
      purchaseDate: twoDaysAgo,
      productionDate: twoDaysAgo,
      shelfLifeDays: 3,
      lowRiskDays: 5,
      mediumRiskDays: 3,
      highRiskDays: 1,
      expireDate: tomorrow,
      remainingQuantity: 2,
      consumedQuantity: 0,
      discardedQuantity: 0,
      createdAt,
      updatedAt: createdAt,
      localOnly: true,
      demo: true,
    },
  ];
}

function ensureDemoInventorySeeded() {
  const list = read(INVENTORY_KEY, []);
  if (Array.isArray(list) && list.some((item) => item && item.demo)) {
    return getInventory();
  }

  saveInventoryList([...(Array.isArray(list) ? list : []), ...createDemoInventoryList()]);
  return getInventory();
}

function normalizeCategoryName(value) {
  const category = String(value || "").trim();
  const map = {
    "\u852c\u83dc": "\u852c\u83dc",
    "\u8089\u7c7b": "\u8089\u7c7b",
    "\u6d77\u9c9c": "\u6d77\u9c9c",
    "\u86cb\u5976": "\u86cb\u5976",
    "\u6c34\u679c": "\u6c34\u679c",
    "\u4e3b\u98df": "\u4e3b\u98df",
    "\u8c03\u6599": "\u8c03\u6599",
    "\u5176\u4ed6": "\u5176\u4ed6",
  };

  return map[category] || category || "\u5176\u4ed6";
}

function getCategoryWarningRules(category) {
  const normalizedCategory = normalizeCategoryName(category);
  const rules =
    CATEGORY_WARNING_RULES[normalizedCategory] ||
    CATEGORY_WARNING_RULES["其他"];
  return { ...rules };
}

function normalizeWarningRules(ruleLike, category) {
  const defaults = getCategoryWarningRules(
    category || (ruleLike && ruleLike.category),
  );
  let lowRiskDays = parsePositiveInteger(ruleLike && ruleLike.lowRiskDays);
  let mediumRiskDays = parsePositiveInteger(
    ruleLike && ruleLike.mediumRiskDays,
  );
  let highRiskDays = parsePositiveInteger(ruleLike && ruleLike.highRiskDays);

  lowRiskDays = lowRiskDays || defaults.lowRiskDays;
  mediumRiskDays = mediumRiskDays || defaults.mediumRiskDays;
  highRiskDays = highRiskDays || defaults.highRiskDays;

  if (mediumRiskDays > lowRiskDays) mediumRiskDays = lowRiskDays;
  if (highRiskDays > mediumRiskDays) highRiskDays = mediumRiskDays;

  return { lowRiskDays, mediumRiskDays, highRiskDays };
}

function resolveWarningRules(item) {
  return normalizeWarningRules({
    category: item && item.category,
    lowRiskDays:
      item &&
      (item.lowRiskDays !== undefined
        ? item.lowRiskDays
        : item.low_risk_days !== undefined
          ? item.low_risk_days
          : item.default_low_risk_days),
    mediumRiskDays:
      item &&
      (item.mediumRiskDays !== undefined
        ? item.mediumRiskDays
        : item.medium_risk_days !== undefined
          ? item.medium_risk_days
          : item.default_medium_risk_days),
    highRiskDays:
      item &&
      (item.highRiskDays !== undefined
        ? item.highRiskDays
        : item.high_risk_days !== undefined
          ? item.high_risk_days
          : item.default_high_risk_days),
  });
}

function mapServerInventoryItem(item) {
  const createdAt = item.created_at || nowISO();
  const category = normalizeCategoryName(item.category_name);
  const warningRules = resolveWarningRules({
    category,
    low_risk_days: item.low_risk_days,
    medium_risk_days: item.medium_risk_days,
    high_risk_days: item.high_risk_days,
  });

  return {
    id: String(item.id),
    remoteId: item.id,
    userId: item.user_id,
    ingredientId: item.ingredient_id,
    batchNo: item.batch_no || "",
    inputType: item.input_type || "manual",
    sourceText: item.source_text || "",
    name: item.ingredient_name || "",
    category,
    quantity: parseNumber(item.quantity),
    unit: item.unit || "",
    purchaseDate: formatLocalDate(item.purchase_date),
    productionDate: formatLocalDate(item.production_date),
    shelfLifeDays: parseNumber(item.shelf_life_days),
    lowRiskDays: warningRules.lowRiskDays,
    mediumRiskDays: warningRules.mediumRiskDays,
    highRiskDays: warningRules.highRiskDays,
    expireDate: formatLocalDate(item.expire_date),
    remainingQuantity: parseNumber(item.remaining_quantity),
    consumedQuantity: parseNumber(item.consumed_quantity),
    discardedQuantity: parseNumber(item.discarded_quantity),
    consumed: item.status === "consumed",
    discarded: item.status === "discarded",
    handledTime: item.handled_time || "",
    createdAt,
    updatedAt: item.updated_at || createdAt,
  };
}

function rememberHistoryName(name) {
  if (!name) return;
  const history = read(HISTORY_KEY, {});
  history[name] = (history[name] || 0) + 1;
  write(HISTORY_KEY, history);
}

async function ensureCurrentUser() {
  if (currentUserPromise) return currentUserPromise;

  currentUserPromise = (async () => {
    const settings = getSettings();
    const nickname = settings.userName || defaultSettings.userName;

    let payload = await requestJson({
      url: `${USERS_API_URL}?openid=${encodeURIComponent(LOCAL_USER_OPENID)}&page=1&pageSize=1`,
      method: "GET",
      timeout: 10000,
    });
    if (payload.data && payload.data.length) return payload.data[0];

    payload = await requestJson({
      url: `${USERS_API_URL}?keyword=${encodeURIComponent(nickname)}&page=1&pageSize=20`,
      method: "GET",
      timeout: 10000,
    });
    if (payload.data && payload.data.length) {
      const matchedUser =
        payload.data.find((item) => item.nickname === nickname) ||
        payload.data[0];
      if (matchedUser) return matchedUser;
    }

    payload = await requestJson({
      url: `${USERS_API_URL}?page=1&pageSize=1`,
      method: "GET",
      timeout: 10000,
    });
    if (payload.data && payload.data.length) return payload.data[0];

    return requestJson({
      url: USERS_API_URL,
      method: "POST",
      timeout: 10000,
      header: {
        "content-type": "application/json",
      },
      data: {
        openid: LOCAL_USER_OPENID,
        nickname,
      },
    });
  })().catch((err) => {
    currentUserPromise = null;
    throw err;
  });

  return currentUserPromise;
}

async function ensureIngredient(item, userId) {
  const name = String(item.name || "").trim();
  if (!name) throw new Error("Ingredient name is required");
  const warningRules = resolveWarningRules(item);

  const payload = await requestJson({
    url: `${INGREDIENTS_API_URL}?keyword=${encodeURIComponent(name)}&page=1&pageSize=20`,
    method: "GET",
    timeout: 10000,
  });

  const matched = (payload.data || []).find(
    (ingredient) => ingredient.ingredient_name === name,
  );
  if (matched) return matched;

  return requestJson({
    url: INGREDIENTS_API_URL,
    method: "POST",
    timeout: 10000,
    header: {
      "content-type": "application/json",
    },
    data: {
      ingredient_code: makeIngredientCode(),
      ingredient_name: name,
      category_name: normalizeCategoryName(item.category),
      default_unit: item.unit,
      default_shelf_life_days:
        parsePositiveInteger(item.shelfLifeDays) || undefined,
      default_low_risk_days: warningRules.lowRiskDays,
      default_medium_risk_days: warningRules.mediumRiskDays,
      default_high_risk_days: warningRules.highRiskDays,
      created_by: userId || undefined,
      status: 1,
    },
  });
}

async function resolveIngredientId(item, existingItem) {
  if (
    existingItem &&
    existingItem.ingredientId &&
    String(existingItem.name || "").trim() === String(item.name || "").trim() &&
    normalizeCategoryName(existingItem.category) ===
      normalizeCategoryName(item.category)
  ) {
    return existingItem.ingredientId;
  }

  if (item.ingredientId && !existingItem) return item.ingredientId;

  const user = await ensureCurrentUser();
  const ingredient = await ensureIngredient(item, user.id);
  return ingredient.id;
}

function buildCreatePayload(item, userId, ingredientId) {
  const warningRules = resolveWarningRules(item);
  return {
    user_id: userId,
    ingredient_id: ingredientId,
    input_type: item.inputType || "manual",
    source_text: item.sourceText || "",
    quantity: parseNumber(item.quantity),
    unit: item.unit,
    purchase_date: getBackendPurchaseDate(item),
    production_date: getBackendProductionDate(item),
    expire_date: parseOptionalDate(item.expireDate),
    shelf_life_days: getBackendShelfLifeDays(item),
    low_risk_days: warningRules.lowRiskDays,
    medium_risk_days: warningRules.mediumRiskDays,
    high_risk_days: warningRules.highRiskDays,
  };
}

function buildUpdatePayload(item, existingItem, ingredientId) {
  const quantity = parseNumber(item.quantity);
  const consumedQuantity = parseNumber(
    item.consumedQuantity !== undefined
      ? item.consumedQuantity
      : existingItem.consumedQuantity,
  );
  const discardedQuantity = parseNumber(
    item.discardedQuantity !== undefined
      ? item.discardedQuantity
      : existingItem.discardedQuantity,
  );
  const isConsumed = !!item.consumed;
  const isDiscarded = !!item.discarded;
  const warningRules = normalizeWarningRules(
    {
      lowRiskDays:
        item.lowRiskDays !== undefined
          ? item.lowRiskDays
          : existingItem.lowRiskDays,
      mediumRiskDays:
        item.mediumRiskDays !== undefined
          ? item.mediumRiskDays
          : existingItem.mediumRiskDays,
      highRiskDays:
        item.highRiskDays !== undefined
          ? item.highRiskDays
          : existingItem.highRiskDays,
    },
    item.category || existingItem.category,
  );

  let remainingQuantity = parseNumber(
    item.remainingQuantity !== undefined && item.remainingQuantity !== ""
      ? item.remainingQuantity
      : quantity - consumedQuantity - discardedQuantity,
  );

  if (isConsumed || isDiscarded) remainingQuantity = 0;

  return {
    ingredient_id: ingredientId,
    input_type: item.inputType || existingItem.inputType || "manual",
    source_text:
      item.sourceText !== undefined
        ? item.sourceText
        : existingItem.sourceText || "",
    quantity,
    unit: item.unit,
    purchase_date: getBackendPurchaseDate(item, existingItem),
    production_date: getBackendProductionDate(item, existingItem),
    expire_date: parseOptionalDate(item.expireDate),
    shelf_life_days: getBackendShelfLifeDays(item, existingItem),
    low_risk_days: warningRules.lowRiskDays,
    medium_risk_days: warningRules.mediumRiskDays,
    high_risk_days: warningRules.highRiskDays,
    remaining_quantity: Math.max(0, remainingQuantity),
    consumed_quantity: isConsumed ? quantity : consumedQuantity,
    discarded_quantity: isDiscarded ? quantity : discardedQuantity,
    status: isConsumed ? "consumed" : isDiscarded ? "discarded" : "in_stock",
    handled_time:
      isConsumed || isDiscarded ? formatDateTimeForSql(new Date()) : null,
  };
}

async function createInventoryRecord(item) {
  try {
    const user = item.userId ? { id: item.userId } : await ensureCurrentUser();
    const ingredientId = item.ingredientId || (await resolveIngredientId(item));
    const payload = buildCreatePayload(item, user.id, ingredientId);
    const row = await requestJson({
      url: INVENTORY_API_URL,
      method: "POST",
      timeout: 10000,
      header: {
        "content-type": "application/json",
      },
      data: payload,
    });

    rememberHistoryName(item.name);
    await syncInventoryFromServer();
    return mapServerInventoryItem(row);
  } catch (err) {
    if (!shouldUseLocalInventoryFallback(err)) throw err;
    return saveLocalInventoryItem(item);
  }
}

async function updateInventoryRecord(item) {
  const targetId = item.remoteId || item.id;
  const existingItem = getInventory().find(
    (v) =>
      String(v.id) === String(item.id) ||
      String(v.remoteId) === String(targetId),
  );
  if (!existingItem) throw new Error("Inventory record not found");

  try {
    const ingredientId = await resolveIngredientId(item, existingItem);
    const payload = buildUpdatePayload(item, existingItem, ingredientId);
    const row = await requestJson({
      url: `${INVENTORY_API_URL}/${targetId}`,
      method: "PUT",
      timeout: 10000,
      header: {
        "content-type": "application/json",
      },
      data: payload,
    });

    await syncInventoryFromServer();
    return mapServerInventoryItem(row);
  } catch (err) {
    if (!shouldUseLocalInventoryFallback(err)) throw err;
    return saveLocalInventoryItem(item, existingItem);
  }
}

function read(key, fallback) {
  try {
    const v = wx.getStorageSync(key);
    return v || fallback;
  } catch (e) {
    return fallback;
  }
}

function write(key, value) {
  wx.setStorageSync(key, value);
}

function syncInventoryFromServer() {
  if (inventorySyncPromise) return inventorySyncPromise;

  inventorySyncPromise = request({
    url: `${INVENTORY_API_URL}?user_id=${DEFAULT_INVENTORY_USER_ID}&page=1&pageSize=1000`,
    method: "GET",
    timeout: 10000,
    header: {
      "content-type": "application/json",
    },
  })
    .then((res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        const error = new Error(
          `Inventory request failed with status ${res.statusCode}`,
        );
        error.statusCode = res.statusCode;
        throw error;
      }

      const payload = res.data || {};
      if (!Array.isArray(payload.data)) {
        throw new Error("Inventory payload is invalid");
      }

      saveInventoryList(payload.data.map(mapServerInventoryItem));
      return getInventory();
    })
    .catch((err) => {
      if (!shouldUseLocalInventoryFallback(err)) throw err;
      return ensureDemoInventorySeeded();
    })
    .finally(() => {
      inventorySyncPromise = null;
    });

  return inventorySyncPromise;
}

function getSettings() {
  return {
    ...defaultSettings,
    ...read(SETTINGS_KEY, {}),
  };
}

function saveSettings(settings) {
  write(SETTINGS_KEY, {
    ...defaultSettings,
    ...settings,
  });
}

function getInventory() {
  const list = read(INVENTORY_KEY, []);
  return list
    .map((item) => ({ ...item, status: computeStatus(item) }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function saveInventoryList(list) {
  write(INVENTORY_KEY, list);
}

function buildLocalInventoryItem(item, existingItem) {
  const now = nowISO();
  const warningRules = resolveWarningRules(item);
  const quantity = parseNumber(item.quantity);
  const consumedQuantity = parseNumber(item.consumedQuantity);
  const discardedQuantity = parseNumber(item.discardedQuantity);
  const consumed = !!item.consumed;
  const discarded = !!item.discarded;
  const remainingQuantity =
    consumed || discarded
      ? 0
      : parseNumber(
          item.remainingQuantity !== undefined
            ? item.remainingQuantity
            : quantity - consumedQuantity - discardedQuantity,
        );

  return {
    ...(existingItem || {}),
    id: existingItem ? existingItem.id : item.id || makeLocalInventoryId(),
    remoteId: existingItem ? existingItem.remoteId : item.remoteId,
    userId:
      item.userId ||
      (existingItem && existingItem.userId) ||
      DEFAULT_INVENTORY_USER_ID,
    ingredientId:
      item.ingredientId || (existingItem && existingItem.ingredientId) || "",
    batchNo: item.batchNo || (existingItem && existingItem.batchNo) || "",
    inputType:
      item.inputType || (existingItem && existingItem.inputType) || "manual",
    sourceText:
      item.sourceText !== undefined
        ? item.sourceText
        : (existingItem && existingItem.sourceText) || "",
    name: String(item.name || (existingItem && existingItem.name) || "").trim(),
    category: normalizeCategoryName(
      item.category || (existingItem && existingItem.category),
    ),
    quantity,
    unit: item.unit || (existingItem && existingItem.unit) || "",
    purchaseDate: parseOptionalDate(item.purchaseDate) || "",
    productionDate: parseOptionalDate(item.productionDate) || "",
    shelfLifeDays: parseNumber(item.shelfLifeDays),
    lowRiskDays: warningRules.lowRiskDays,
    mediumRiskDays: warningRules.mediumRiskDays,
    highRiskDays: warningRules.highRiskDays,
    expireDate: parseOptionalDate(item.expireDate) || "",
    remainingQuantity: Math.max(0, remainingQuantity),
    consumedQuantity: consumed ? quantity : consumedQuantity,
    discardedQuantity: discarded ? quantity : discardedQuantity,
    consumed,
    discarded,
    handledTime:
      consumed || discarded
        ? formatDateTimeForSql(new Date())
        : (existingItem && existingItem.handledTime) || "",
    createdAt: (existingItem && existingItem.createdAt) || now,
    updatedAt: now,
    localOnly: !item.remoteId,
  };
}

function saveLocalInventoryItem(item, existingItem) {
  const localItem = buildLocalInventoryItem(item, existingItem);
  const list = read(INVENTORY_KEY, []);
  const index = list.findIndex(
    (v) =>
      String(v.id) === String(localItem.id) ||
      (localItem.remoteId && String(v.remoteId) === String(localItem.remoteId)),
  );

  if (index >= 0) {
    list[index] = localItem;
  } else {
    list.unshift(localItem);
  }

  saveInventoryList(list);
  if (!existingItem) rememberHistoryName(localItem.name);
  return { ...localItem, status: computeStatus(localItem) };
}

function upsertInventory(item) {
  if (item.id || item.remoteId) return updateInventoryRecord(item);
  return createInventoryRecord(item);
}

function deleteInventory(id) {
  const item = getInventory().find(
    (v) => String(v.id) === String(id) || String(v.remoteId) === String(id),
  );
  if (!item) return Promise.reject(new Error("Inventory record not found"));

  return requestJson({
    url: `${INVENTORY_API_URL}/${item.remoteId || item.id}`,
    method: "DELETE",
    timeout: 10000,
  })
    .then(() => syncInventoryFromServer())
    .catch((err) => {
      if (!shouldUseLocalInventoryFallback(err)) throw err;
      saveInventoryList(
        read(INVENTORY_KEY, []).filter((v) => {
          const sameLocalId = String(v.id) === String(item.id);
          const sameRemoteId =
            item.remoteId && String(v.remoteId) === String(item.remoteId);
          return !sameLocalId && !sameRemoteId;
        }),
      );
      return getInventory();
    });
}

function updateInventoryStatus(id, mode) {
  const item = getInventory().find(
    (v) => String(v.id) === String(id) || String(v.remoteId) === String(id),
  );
  if (!item) return Promise.reject(new Error("Inventory record not found"));

  const availableQuantity = parseNumber(
    item.remainingQuantity !== undefined
      ? item.remainingQuantity
      : getAvailableQuantity(item),
  );
  const consumedQuantity = parseNumber(item.consumedQuantity);
  const discardedQuantity = parseNumber(item.discardedQuantity);
  const payload = {
    remaining_quantity: 0,
    status: mode,
    handled_time: formatDateTimeForSql(new Date()),
  };

  if (mode === "consumed") {
    payload.consumed_quantity = consumedQuantity + availableQuantity;
    payload.discarded_quantity = discardedQuantity;
  } else if (mode === "discarded") {
    payload.consumed_quantity = consumedQuantity;
    payload.discarded_quantity = discardedQuantity + availableQuantity;
  } else {
    return Promise.reject(new Error("Unsupported inventory status"));
  }

  return requestJson({
    url: `${INVENTORY_API_URL}/${item.remoteId || item.id}`,
    method: "PUT",
    timeout: 10000,
    header: {
      "content-type": "application/json",
    },
    data: payload,
  })
    .then(() => syncInventoryFromServer())
    .catch((err) => {
      if (!shouldUseLocalInventoryFallback(err)) throw err;
      return saveLocalInventoryItem(
        {
          ...item,
          remainingQuantity: 0,
          consumedQuantity: payload.consumed_quantity,
          discardedQuantity: payload.discarded_quantity,
          consumed: mode === "consumed",
          discarded: mode === "discarded",
        },
        item,
      );
    });
}

function computeStatus(item) {
  if (item.consumed) return "consumed";
  if (item.discarded) return "discarded";
  if (!item.expireDate) return "in_stock";
  const warningRules = resolveWarningRules(item);
  const today = new Date();
  const expire = new Date(item.expireDate + "T23:59:59");
  const diff = Math.ceil((expire - today) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "expired";
  if (diff <= warningRules.highRiskDays) return "high_risk";
  if (diff <= warningRules.mediumRiskDays) return "medium_risk";
  if (diff <= warningRules.lowRiskDays) return "low_risk";
  return "in_stock";
}

function getStatusText(status) {
  const map = {
    in_stock: "正常",
    low_risk: "低风险",
    medium_risk: "中风险",
    high_risk: "高风险",
    expired: "过期",
    consumed: "已使用",
    discarded: "已丢弃",
  };
  return map[status] || "正常";
}

function normalizeIngredient(name) {
  const text = String(name || "")
    .trim()
    .replace(/\s/g, "");
  return ingredientAliasMap[text] || text;
}

function getMainIngredients(recipe) {
  return (recipe.ingredients || []).filter((item) => item.required !== false);
}

function getOptionalIngredients(recipe) {
  return (recipe.ingredients || []).filter((item) => item.required === false);
}

function getEffortBonus(recipe) {
  let bonus = 0;
  if (recipe.difficulty === "简单") bonus += 5;
  if (Number(recipe.cookTime) <= 15) bonus += 5;
  else if (Number(recipe.cookTime) <= 25) bonus += 2;
  return bonus;
}

function getRecipeSortIndex(recipe) {
  return Number(String(recipe.id || "").replace(/\D/g, "")) || 0;
}

function getRecipeRecommendations() {
  const inventory = getInventory().filter((item) =>
    ACTIVE_INVENTORY_STATUSES.includes(item.status),
  );
  const inventoryNames = new Set(
    inventory.map((item) => normalizeIngredient(item.name)),
  );
  const expiringNames = new Set(
    inventory
      .filter((item) => EXPIRING_STATUSES.includes(item.status))
      .map((item) => normalizeIngredient(item.name)),
  );

  return builtinRecipes
    .map((recipe) => {
      const mainIngredients = getMainIngredients(recipe);
      const optionalIngredients = getOptionalIngredients(recipe);
      const matched = mainIngredients.filter((item) =>
        inventoryNames.has(normalizeIngredient(item.name)),
      );
      const missing = mainIngredients.filter(
        (item) => !inventoryNames.has(normalizeIngredient(item.name)),
      );
      const matchedOptional = optionalIngredients.filter((item) =>
        inventoryNames.has(normalizeIngredient(item.name)),
      );
      const missingOptional = optionalIngredients.filter(
        (item) => !inventoryNames.has(normalizeIngredient(item.name)),
      );
      const missingSeasonings = (recipe.seasonings || []).filter(
        (item) => !inventoryNames.has(normalizeIngredient(item.name)),
      );
      const expiringMatched = mainIngredients.filter((item) =>
        expiringNames.has(normalizeIngredient(item.name)),
      );

      const totalCount = mainIngredients.length;
      const matchedCount = matched.length;
      const baseMatchRate = totalCount
        ? Math.round((matchedCount / totalCount) * 100)
        : 0;
      const expiringBonus = expiringMatched.length
        ? Math.min(20, expiringMatched.length * 10)
        : 0;
      const missingPenalty = missing.length > 1 ? (missing.length - 1) * 8 : 0;
      const score = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            baseMatchRate +
              expiringBonus +
              getEffortBonus(recipe) -
              missingPenalty,
          ),
        ),
      );

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
        matchSummary: `${matchedCount}/${totalCount}`,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.cookTime - b.cookTime ||
        a.sortIndex - b.sortIndex,
    );
}

function formatQuantityText(quantity) {
  const number = Number(quantity);
  if (!Number.isFinite(number)) return "0";
  return Number.isInteger(number)
    ? String(number)
    : String(Number(number.toFixed(2)));
}

function getAvailableQuantity(item) {
  if (!ACTIVE_INVENTORY_STATUSES.includes(item.status)) return 0;
  const quantity =
    item.remainingQuantity !== undefined && item.remainingQuantity !== ""
      ? Number(item.remainingQuantity)
      : Number(item.quantity);
  return Number.isFinite(quantity) ? quantity : 0;
}

function getPurchaseSuggestions() {
  const history = read(HISTORY_KEY, {});
  const inventory = getInventory();
  const historyMap = Object.keys(history).reduce((map, name) => {
    const key = normalizeIngredient(name);
    if (!key) return map;
    if (!map[key]) {
      map[key] = {
        key,
        name,
        count: 0,
      };
    }
    map[key].count += Number(history[name]) || 0;
    return map;
  }, {});

  const inventoryHistoryCounts = inventory.reduce((map, item) => {
    const key = normalizeIngredient(item.name);
    if (!key) return map;
    if (!map[key]) {
      map[key] = {
        name: item.name,
        count: 0,
      };
    }
    map[key].count += 1;
    if (!map[key].name && item.name) map[key].name = item.name;
    return map;
  }, {});

  Object.keys(inventoryHistoryCounts).forEach((key) => {
    const inventoryHistory = inventoryHistoryCounts[key];
    if (!historyMap[key]) {
      historyMap[key] = {
        key,
        name: inventoryHistory.name,
        count: 0,
      };
    }
    historyMap[key].count = Math.max(historyMap[key].count, inventoryHistory.count);
    if (!historyMap[key].name && inventoryHistory.name) historyMap[key].name = inventoryHistory.name;
  });

  const stockMap = inventory.reduce((map, item) => {
    const key = normalizeIngredient(item.name);
    if (!key) return map;
    if (!map[key]) {
      map[key] = {
        quantity: 0,
        units: new Set(),
        category: "",
      };
    }
    const quantity = getAvailableQuantity(item);
    map[key].quantity += quantity;
    if (quantity > 0 && item.unit) map[key].units.add(item.unit);
    if (!map[key].category && item.category) map[key].category = item.category;
    return map;
  }, {});

  return Object.keys(historyMap)
    .map((key) => {
      const historyItem = historyMap[key];
      const stockItem = stockMap[key] || { quantity: 0, units: new Set() };
      const currentQuantity = stockItem.quantity;
      const units = Array.from(stockItem.units);
      const quantityText =
        currentQuantity > 0
          ? `${formatQuantityText(currentQuantity)}${units.length === 1 ? units[0] : ""}`
          : "0";
      const urgency = currentQuantity <= 0 ? "urgent" : "low";

      return {
        key,
        dismissKey: `${key}_${urgency}_${quantityText}`,
        name: historyItem.name,
        category: stockItem.category || "",
        historyCount: historyItem.count,
        currentQuantity,
        quantityText,
        urgency,
        tagText: urgency === "urgent" ? "紧急补充" : "建议补充",
        reason:
          urgency === "urgent"
            ? `历史录入 ${historyItem.count} 次，当前库存为 0`
            : `历史录入 ${historyItem.count} 次，当前仅剩 ${quantityText}`,
      };
    })
    .filter((item) => item.historyCount >= 2 && item.currentQuantity <= 1)
    .sort((a, b) => {
      if (a.urgency !== b.urgency) return a.urgency === "urgent" ? -1 : 1;
      return (
        b.historyCount - a.historyCount ||
        a.currentQuantity - b.currentQuantity ||
        a.name.localeCompare(b.name, "zh-Hans-CN")
      );
    })
    .slice(0, 8);
}

function getReminderSummary() {
  const inventory = getInventory();
  const lowRisk = inventory.filter((item) => item.status === "low_risk");
  const mediumRisk = inventory.filter((item) => item.status === "medium_risk");
  const highRisk = inventory.filter((item) => item.status === "high_risk");
  const expired = inventory.filter((item) => item.status === "expired");
  return {
    expiring: [...highRisk, ...mediumRisk, ...lowRisk],
    lowRisk,
    mediumRisk,
    highRisk,
    expired,
  };
}

function getWeekStart(date) {
  const current = new Date(date);
  const day = current.getDay() || 7;
  current.setHours(0, 0, 0, 0);
  current.setDate(current.getDate() - day + 1);
  return current;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseStoredDate(value, endOfDay) {
  if (!value) return null;
  const date = new Date(
    String(value).includes("T")
      ? value
      : `${value}T${endOfDay ? "23:59:59" : "00:00:00"}`,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function isDateInRange(value, start, end, endOfDay) {
  const date = parseStoredDate(value, endOfDay);
  return !!date && date >= start && date < end;
}

function getTrend(current, previous, inverse) {
  const rawDiff = current - previous;
  const scoreDiff = inverse ? -rawDiff : rawDiff;
  const absDiff = Math.abs(rawDiff);
  if (absDiff === 0) {
    return {
      text: "持平 0%",
      className: "neutral",
    };
  }

  const arrow = rawDiff > 0 ? "↑" : "↓";
  const sign = rawDiff > 0 ? "+" : "-";
  return {
    text: `${arrow} ${sign}${absDiff}%`,
    className: scoreDiff > 0 ? "positive" : "negative",
  };
}

function getActionRate(used, expired, discarded) {
  const total = used + expired + discarded;
  return total ? Math.round((used / total) * 100) : 0;
}

function getWasteRate(expired, discarded, used) {
  const total = used + expired + discarded;
  return total ? Math.round(((expired + discarded) / total) * 100) : 0;
}

function getStats() {
  const list = getInventory();
  const total = list.length;
  const used = list.filter((item) => item.consumed).length;
  const discarded = list.filter((item) => item.discarded).length;
  const expired = list.filter((item) => item.status === "expired").length;
  const lowRisk = list.filter((item) => item.status === "low_risk").length;
  const mediumRisk = list.filter(
    (item) => item.status === "medium_risk",
  ).length;
  const highRisk = list.filter((item) => item.status === "high_risk").length;
  const handled = list.filter(
    (item) => item.status === "consumed" || item.status === "discarded",
  ).length;
  const reminderTargets = list.filter((item) =>
    [...EXPIRING_STATUSES, "expired", "consumed", "discarded"].includes(
      item.status,
    ),
  ).length;
  const wasteRate = total
    ? Math.round(((expired + discarded) / total) * 100)
    : 0;

  const weekStart = getWeekStart(new Date());
  const nextWeekStart = addDays(weekStart, 7);
  const previousWeekStart = addDays(weekStart, -7);

  const addedThisWeek = list.filter((item) =>
    isDateInRange(item.createdAt, weekStart, nextWeekStart),
  ).length;
  const usedThisWeek = list.filter(
    (item) =>
      item.consumed && isDateInRange(item.updatedAt, weekStart, nextWeekStart),
  ).length;
  const expiredThisWeek = list.filter(
    (item) =>
      item.status === "expired" &&
      isDateInRange(item.expireDate, weekStart, nextWeekStart, true),
  ).length;
  const discardedThisWeek = list.filter(
    (item) =>
      item.discarded && isDateInRange(item.updatedAt, weekStart, nextWeekStart),
  ).length;

  const previousUsed = list.filter(
    (item) =>
      item.consumed &&
      isDateInRange(item.updatedAt, previousWeekStart, weekStart),
  ).length;
  const previousExpired = list.filter(
    (item) =>
      item.status === "expired" &&
      isDateInRange(item.expireDate, previousWeekStart, weekStart, true),
  ).length;
  const previousDiscarded = list.filter(
    (item) =>
      item.discarded &&
      isDateInRange(item.updatedAt, previousWeekStart, weekStart),
  ).length;

  const weeklyWasteRate = getWasteRate(
    expiredThisWeek,
    discardedThisWeek,
    usedThisWeek,
  );
  const previousWasteRate = getWasteRate(
    previousExpired,
    previousDiscarded,
    previousUsed,
  );
  const weeklyUtilizationRate = getActionRate(
    usedThisWeek,
    expiredThisWeek,
    discardedThisWeek,
  );
  const previousUtilizationRate = getActionRate(
    previousUsed,
    previousExpired,
    previousDiscarded,
  );
  const weeklyReminderHandleRate =
    usedThisWeek + discardedThisWeek + expiredThisWeek
      ? Math.round(
          ((usedThisWeek + discardedThisWeek) /
            (usedThisWeek + discardedThisWeek + expiredThisWeek)) *
            100,
        )
      : 0;
  const previousReminderHandleRate =
    previousUsed + previousDiscarded + previousExpired
      ? Math.round(
          ((previousUsed + previousDiscarded) /
            (previousUsed + previousDiscarded + previousExpired)) *
            100,
        )
      : 0;

  return {
    total,
    used,
    expired,
    discarded,
    riskStages: {
      lowRisk,
      mediumRisk,
      highRisk,
      expired,
    },
    utilizationRate: total ? Math.round((used / total) * 100) : 0,
    reminderHandleRate: reminderTargets
      ? Math.round((handled / reminderTargets) * 100)
      : 0,
    wasteRate,
    wasteControlRate: Math.max(0, 100 - wasteRate),
    weekly: {
      added: addedThisWeek,
      used: usedThisWeek,
      expired: expiredThisWeek,
      discarded: discardedThisWeek,
      wasteRate: weeklyWasteRate,
    },
    trends: {
      utilization: getTrend(weeklyUtilizationRate, previousUtilizationRate),
      reminder: getTrend(weeklyReminderHandleRate, previousReminderHandleRate),
      waste: getTrend(weeklyWasteRate, previousWasteRate, true),
    },
  };
}

function getCategories() {
  return ["蔬菜", "肉类", "海鲜", "蛋奶", "水果", "主食", "调料", "其他"];
}

module.exports = {
  getSettings,
  saveSettings,
  syncInventoryFromServer,
  getInventory,
  upsertInventory,
  deleteInventory,
  updateInventoryStatus,
  getStatusText,
  getRecipeRecommendations,
  getPurchaseSuggestions,
  getReminderSummary,
  getStats,
  getCategories,
  getCategoryWarningRules,
};
