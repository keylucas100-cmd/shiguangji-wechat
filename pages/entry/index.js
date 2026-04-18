const store = require("../../utils/store");
const theme = require("../../utils/theme");

function formatToday() {
  return formatDate(new Date());
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function calculateExpireDate(productionDate, shelfLifeDays) {
  const days = Number(shelfLifeDays);
  if (!productionDate || !Number.isInteger(days) || days <= 0) return "";

  const expire = new Date(productionDate + "T00:00:00");
  if (Number.isNaN(expire.getTime())) return "";

  expire.setDate(expire.getDate() + days);
  return formatDate(expire);
}

function getResolvedExpireDate(form) {
  return (
    calculateExpireDate(form.productionDate, form.shelfLifeDays) ||
    form.expireDate ||
    ""
  );
}

function createDefaultForm() {
  return {
    id: "",
    name: "",
    category: "",
    quantity: "",
    unit: "",
    purchaseDate: "",
    productionDate: "",
    shelfLifeDays: "",
    lowRiskDays: "",
    mediumRiskDays: "",
    highRiskDays: "",
    expireDate: "",
    inputType: "manual",
    sourceText: "",
    remainingQuantity: 1,
  };
}

function createWarningRuleDraft(source = {}) {
  return {
    lowRiskDays: String(source.lowRiskDays || ""),
    mediumRiskDays: String(source.mediumRiskDays || ""),
    highRiskDays: String(source.highRiskDays || ""),
  };
}

function formatRuleValue(value, fallback) {
  const number = Number(value);
  if (Number.isInteger(number) && number > 0) return String(number);
  return String(fallback);
}

function getWarningRuleFormData(category, source = {}) {
  const defaults = store.getCategoryWarningRules(category);
  return {
    lowRiskDays: formatRuleValue(source.lowRiskDays, defaults.lowRiskDays),
    mediumRiskDays: formatRuleValue(
      source.mediumRiskDays,
      defaults.mediumRiskDays,
    ),
    highRiskDays: formatRuleValue(source.highRiskDays, defaults.highRiskDays),
  };
}

function buildWarningRuleUpdates(prefix, category, source = {}) {
  const rules = getWarningRuleFormData(category, source);
  return {
    [`${prefix}.lowRiskDays`]: rules.lowRiskDays,
    [`${prefix}.mediumRiskDays`]: rules.mediumRiskDays,
    [`${prefix}.highRiskDays`]: rules.highRiskDays,
  };
}

function clearWarningRuleUpdates(prefix) {
  return {
    [`${prefix}.lowRiskDays`]: "",
    [`${prefix}.mediumRiskDays`]: "",
    [`${prefix}.highRiskDays`]: "",
  };
}

function getWarningRuleValidationMessage(form) {
  const lowRiskDays = Number(form.lowRiskDays);
  const mediumRiskDays = Number(form.mediumRiskDays);
  const highRiskDays = Number(form.highRiskDays);
  const isValid = [lowRiskDays, mediumRiskDays, highRiskDays].every(
    (value) => Number.isInteger(value) && value > 0,
  );

  if (!isValid) return "请输入正确的预警阈值";
  if (lowRiskDays < mediumRiskDays || mediumRiskDays < highRiskDays) {
    return "请保持低风险阈值 ≥ 中风险阈值 ≥ 高风险阈值";
  }
  return "";
}

function getUnitIndex(units, unit) {
  const idx = units.findIndex((v) => v === unit);
  return idx > -1 ? idx : 0;
}

const knownFoods = [
  { name: "牛肉", category: "肉类" },
  { name: "牛腩", category: "肉类" },
  { name: "牛排", category: "肉类" },
  { name: "肥牛", category: "肉类" },
  { name: "鸡肉", category: "肉类" },
  { name: "鸡胸肉", category: "肉类" },
  { name: "鸡腿", category: "肉类" },
  { name: "鸡翅", category: "肉类" },
  { name: "猪肉", category: "肉类" },
  { name: "五花肉", category: "肉类" },
  { name: "里脊肉", category: "肉类" },
  { name: "排骨", category: "肉类" },
  { name: "羊肉", category: "肉类" },
  { name: "鸭肉", category: "肉类" },
  { name: "鸭腿", category: "肉类" },
  { name: "鱼肉", category: "海鲜" },
  { name: "鱼片", category: "海鲜" },
  { name: "三文鱼", category: "海鲜" },
  { name: "带鱼", category: "海鲜" },
  { name: "鲈鱼", category: "海鲜" },
  { name: "鳕鱼", category: "海鲜" },
  { name: "黄鱼", category: "海鲜" },
  { name: "虾", category: "海鲜" },
  { name: "虾仁", category: "海鲜" },
  { name: "虾滑", category: "海鲜" },
  { name: "蟹肉", category: "海鲜" },
  { name: "蟹棒", category: "海鲜" },
  { name: "鱿鱼", category: "海鲜" },
  { name: "章鱼", category: "海鲜" },
  { name: "扇贝", category: "海鲜" },
  { name: "生蚝", category: "海鲜" },
  { name: "火腿", category: "肉类" },
  { name: "香肠", category: "肉类" },
  { name: "培根", category: "肉类" },
  { name: "鸡蛋", category: "蛋奶" },
  { name: "鸭蛋", category: "蛋奶" },
  { name: "鹌鹑蛋", category: "蛋奶" },
  { name: "牛奶", category: "蛋奶" },
  { name: "酸奶", category: "蛋奶" },
  { name: "奶酪", category: "蛋奶" },
  { name: "芝士", category: "蛋奶" },
  { name: "黄油", category: "蛋奶" },
  { name: "番茄", category: "蔬菜" },
  { name: "西红柿", category: "蔬菜" },
  { name: "茄子", category: "蔬菜" },
  { name: "土豆", category: "蔬菜" },
  { name: "胡萝卜", category: "蔬菜" },
  { name: "白萝卜", category: "蔬菜" },
  { name: "黄瓜", category: "蔬菜" },
  { name: "西兰花", category: "蔬菜" },
  { name: "花菜", category: "蔬菜" },
  { name: "青椒", category: "蔬菜" },
  { name: "彩椒", category: "蔬菜" },
  { name: "洋葱", category: "蔬菜" },
  { name: "生菜", category: "蔬菜" },
  { name: "菠菜", category: "蔬菜" },
  { name: "白菜", category: "蔬菜" },
  { name: "娃娃菜", category: "蔬菜" },
  { name: "油麦菜", category: "蔬菜" },
  { name: "豆角", category: "蔬菜" },
  { name: "四季豆", category: "蔬菜" },
  { name: "南瓜", category: "蔬菜" },
  { name: "冬瓜", category: "蔬菜" },
  { name: "苦瓜", category: "蔬菜" },
  { name: "莲藕", category: "蔬菜" },
  { name: "玉米", category: "蔬菜" },
  { name: "香菇", category: "蔬菜" },
  { name: "蘑菇", category: "蔬菜" },
  { name: "金针菇", category: "蔬菜" },
  { name: "香蕉", category: "水果" },
  { name: "苹果", category: "水果" },
  { name: "橙子", category: "水果" },
  { name: "橘子", category: "水果" },
  { name: "梨", category: "水果" },
  { name: "葡萄", category: "水果" },
  { name: "草莓", category: "水果" },
  { name: "蓝莓", category: "水果" },
  { name: "西瓜", category: "水果" },
  { name: "哈密瓜", category: "水果" },
  { name: "桃子", category: "水果" },
  { name: "芒果", category: "水果" },
  { name: "火龙果", category: "水果" },
  { name: "猕猴桃", category: "水果" },
  { name: "柠檬", category: "水果" },
  { name: "米饭", category: "主食" },
  { name: "大米", category: "主食" },
  { name: "面条", category: "主食" },
  { name: "面包", category: "主食" },
  { name: "馒头", category: "主食" },
  { name: "包子", category: "主食" },
  { name: "饺子", category: "主食" },
  { name: "馄饨", category: "主食" },
  { name: "米粉", category: "主食" },
  { name: "粉丝", category: "主食" },
  { name: "燕麦", category: "主食" },
  { name: "红薯", category: "主食" },
  { name: "紫薯", category: "主食" },
  { name: "盐", category: "调料" },
  { name: "糖", category: "调料" },
  { name: "酱油", category: "调料" },
  { name: "生抽", category: "调料" },
  { name: "老抽", category: "调料" },
  { name: "醋", category: "调料" },
  { name: "料酒", category: "调料" },
  { name: "蚝油", category: "调料" },
  { name: "豆瓣酱", category: "调料" },
  { name: "番茄酱", category: "调料" },
  { name: "沙拉酱", category: "调料" },
  { name: "胡椒粉", category: "调料" },
  { name: "孜然粉", category: "调料" },
  { name: "辣椒粉", category: "调料" },
  { name: "葱", category: "调料" },
  { name: "姜", category: "调料" },
  { name: "蒜", category: "调料" },
  { name: "香菜", category: "调料" },
];

function normalizeFoodName(name) {
  return String(name || "")
    .replace(/\s/g, "")
    .replace(/[，,。.!！?？、]/g, "")
    .replace(
      /^(我|帮我|给我|请|想|要|需要|今天|昨天|昨日|明天|刚刚|刚才|买了|买|购买了|购买|采购了|采购|添加|录入|记录)+/,
      "",
    );
}

function inferCategoryByFoodName(name) {
  const cleanName = normalizeFoodName(name);
  if (!cleanName) return "";

  const knownFood = knownFoods.find(
    (food) => cleanName === food.name || cleanName.includes(food.name),
  );
  if (knownFood) return knownFood.category;

  if (
    /(鱼|虾|蟹|贝|蛤|蚬|螺|鱿鱼|章鱼|墨鱼|带鱼|三文鱼|鳕鱼|鲈鱼|黄鱼|鲫鱼|鲤鱼|鲳鱼|扇贝|生蚝|牡蛎|海鲜)/.test(
      cleanName,
    )
  ) {
    return "海鲜";
  }

  if (cleanName.endsWith("肉")) return "肉类";

  if (
    /(排骨|鸡翅|鸡腿|鸡爪|鸭腿|鸭脖|牛腩|牛排|肥牛|火腿|香肠|培根)/.test(
      cleanName,
    )
  ) {
    return "肉类";
  }

  return "";
}

function extractGenericFoodName(text) {
  const compactText = String(text || "").replace(/\s/g, "");
  const meatMatches = compactText.match(/[\u4e00-\u9fa5]{1,8}肉/g) || [];

  for (const match of meatMatches) {
    const foodName = normalizeFoodName(match);
    if (foodName.length >= 2 && foodName.endsWith("肉")) return foodName;
  }

  return "";
}

function parseNumberText(value) {
  const text = String(value || "")
    .trim()
    .replace(/两/g, "二");
  if (/^\d+(\.\d+)?$/.test(text)) return Number(text);
  if (text === "半") return 0.5;

  const numberMap = {
    零: 0,
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };

  if (text.endsWith("半")) {
    const base = parseNumberText(text.slice(0, -1));
    return Number.isNaN(base) ? NaN : base + 0.5;
  }

  if (text.includes("十")) {
    const parts = text.split("十");
    const tens = parts[0] ? numberMap[parts[0]] : 1;
    const ones = parts[1] ? numberMap[parts[1]] : 0;
    return tens * 10 + ones;
  }

  return Object.prototype.hasOwnProperty.call(numberMap, text)
    ? numberMap[text]
    : NaN;
}

function parseFoodInfo(text) {
  const knownFood =
    knownFoods
      .map((food) => ({ ...food, index: text.indexOf(food.name) }))
      .filter((food) => food.index > -1)
      .sort((a, b) => a.index - b.index || b.name.length - a.name.length)[0] ||
    {};

  if (knownFood.name) {
    return { name: knownFood.name, category: knownFood.category };
  }

  const genericFoodName = extractGenericFoodName(text);
  const genericCategory = inferCategoryByFoodName(genericFoodName);
  return genericCategory
    ? { name: genericFoodName, category: genericCategory }
    : {};
}

function parseQuantityInfo(text) {
  const halfJinMatch = text.match(
    /(\d+(?:\.\d+)?|[一二两三四五六七八九十]+)\s*斤半/,
  );
  if (halfJinMatch) {
    const quantity = parseNumberText(halfJinMatch[1]);
    return Number.isNaN(quantity)
      ? {}
      : { quantity: String(quantity + 0.5), unit: "斤" };
  }

  const match = text.match(
    /(\d+(?:\.\d+)?|[一二两三四五六七八九十半]+)\s*(公斤|千克|kg|KG|克|g|斤|盒|袋|瓶)/,
  );
  if (!match) return {};

  let quantity = parseNumberText(match[1]);
  let unit = match[2];
  if (Number.isNaN(quantity)) return {};

  if (unit === "公斤" || unit === "千克" || unit === "kg" || unit === "KG") {
    quantity *= 1000;
    unit = "克";
  }

  if (unit === "g") unit = "克";

  return { quantity: String(quantity), unit };
}

function parseShelfLifeDays(text) {
  const match = text.match(
    /保质期\s*(\d+(?:\.\d+)?|[一二两三四五六七八九十]+)\s*(天|日|个月|月|年)/,
  );
  if (!match) return "";

  const amount = parseNumberText(match[1]);
  if (Number.isNaN(amount) || amount <= 0) return "";

  const unit = match[2];
  if (unit === "个月" || unit === "月") return String(Math.round(amount * 30));
  if (unit === "年") return String(Math.round(amount * 365));
  return String(Math.round(amount));
}

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function parseRelativeDate(text, keywords) {
  const cleanText = text.replace(/\s/g, "");
  const dayOptions = [
    { text: "今天", value: dateOffset(0) },
    { text: "昨日", value: dateOffset(-1) },
    { text: "昨天", value: dateOffset(-1) },
    { text: "明天", value: dateOffset(1) },
  ];

  for (const day of dayOptions) {
    for (const keyword of keywords) {
      if (
        cleanText.includes(`${day.text}${keyword}`) ||
        cleanText.includes(`${keyword}${day.text}`)
      ) {
        return day.value;
      }
    }
  }

  return "";
}

function parseVoiceText(text) {
  const foodInfo = parseFoodInfo(text);
  const quantityInfo = parseQuantityInfo(text);

  return {
    ...foodInfo,
    ...quantityInfo,
    shelfLifeDays: parseShelfLifeDays(text),
    purchaseDate: parseRelativeDate(text, ["买", "购买", "采购"]),
    productionDate: parseRelativeDate(text, ["生产", "出厂"]),
  };
}

Page({
  data: {
    categories: store.getCategories(),
    units: ["个", "克", "斤", "盒", "袋", "瓶"],
    categoryIndex: 0,
    unitIndex: 0,
    today: formatToday(),
    themeKey: "green",
    themeColor: "#2fb66d",
    voicePanelVisible: false,
    warningRuleModalVisible: false,
    warningRuleDraft: createWarningRuleDraft(),
    clearToastVisible: false,
    voiceText: "",
    form: createDefaultForm(),
  },

  onLoad(query) {
    if (query.id) {
      const item = store.getInventory().find((v) => v.id === query.id);
      if (item) {
        const categories = store.getCategories();
        const idx = Math.max(
          0,
          categories.findIndex((c) => c === item.category),
        );
        this.setData({
          form: {
            ...createDefaultForm(),
            ...item,
            ...getWarningRuleFormData(item.category, item),
            quantity: String(item.quantity || 1),
            shelfLifeDays: item.shelfLifeDays ? String(item.shelfLifeDays) : "",
          },
          categoryIndex: idx,
          unitIndex: getUnitIndex(this.data.units, item.unit),
        });
      }
    }
  },

  onShow() {
    const today = formatToday();
    this.setData({
      ...theme.getThemeData(store.getSettings()),
      today,
    });
  },

  onUnload() {
    if (this.clearToastTimer) {
      clearTimeout(this.clearToastTimer);
      this.clearToastTimer = null;
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    const updates = { [`form.${field}`]: value };

    if (field === "name" && !this.data.form.category) {
      const category = inferCategoryByFoodName(value);
      if (category) {
        updates["form.category"] = category;
        const categoryIndex = this.data.categories.findIndex(
          (v) => v === category,
        );
        if (categoryIndex > -1) updates.categoryIndex = categoryIndex;
        Object.assign(updates, buildWarningRuleUpdates("form", category));
      }
    }

    this.setData(updates, () => {
      if (field === "shelfLifeDays") this.updateExpireDate();
    });
  },

  onCategoryChange(e) {
    const idx = Number(e.detail.value);
    const category = this.data.categories[idx];
    this.setData({
      categoryIndex: idx,
      "form.category": category,
      ...buildWarningRuleUpdates("form", category),
    });
  },

  onUnitChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      unitIndex: idx,
      "form.unit": this.data.units[idx],
    });
  },

  onPurchaseDateChange(e) {
    const purchaseDate = e.detail.value;
    if (
      this.data.form.productionDate &&
      this.data.form.productionDate > purchaseDate
    ) {
      wx.showToast({ title: "出厂日期不能晚于购买日期", icon: "none" });
      return;
    }

    this.setData({
      "form.purchaseDate": purchaseDate,
    });
  },

  onProductionDateChange(e) {
    const productionDate = e.detail.value;
    const { purchaseDate } = this.data.form;

    if (purchaseDate && productionDate > purchaseDate) {
      wx.showToast({ title: "出厂日期不能晚于购买日期", icon: "none" });
      return;
    }

    this.setData({ "form.productionDate": productionDate }, () => {
      this.updateExpireDate();
    });
  },

  updateExpireDate() {
    const { productionDate, shelfLifeDays } = this.data.form;
    const expireDate = calculateExpireDate(productionDate, shelfLifeDays);
    if (!expireDate) return;

    this.setData({
      "form.expireDate": expireDate,
    });
  },

  onExpireDateChange(e) {
    this.setData({
      "form.expireDate": e.detail.value,
    });
  },

  openWarningRuleModal() {
    if (!this.data.form.category) return;
    this.setData({
      warningRuleModalVisible: true,
      warningRuleDraft: createWarningRuleDraft(this.data.form),
    });
  },
  closeWarningRuleModal() {
    this.setData({
      warningRuleModalVisible: false,
      warningRuleDraft: createWarningRuleDraft(),
    });
  },
  onWarningRuleDraftInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`warningRuleDraft.${field}`]: e.detail.value,
    });
  },
  confirmWarningRuleModal() {
    const draft = this.data.warningRuleDraft;
    const warningRuleMessage = getWarningRuleValidationMessage(draft);
    if (warningRuleMessage) {
      wx.showToast({ title: warningRuleMessage, icon: "none" });
      return;
    }

    this.setData({
      "form.lowRiskDays": draft.lowRiskDays,
      "form.mediumRiskDays": draft.mediumRiskDays,
      "form.highRiskDays": draft.highRiskDays,
      warningRuleModalVisible: false,
      warningRuleDraft: createWarningRuleDraft(),
    });
  },

  setManual() {
    this.setData({
      "form.inputType": "manual",
      "form.sourceText": "",
    });
  },
  clearField(e) {
    const field = e.currentTarget.dataset.field;
    const updates = {
      [`form.${field}`]: "",
    };

    if (field === "category") {
      updates.categoryIndex = 0;
      Object.assign(updates, clearWarningRuleUpdates("form"));
    }

    if (field === "unit") {
      updates.unitIndex = 0;
    }

    this.setData(updates, () => {
      if (field === "productionDate" || field === "shelfLifeDays") {
        if (!this.data.form.productionDate || !this.data.form.shelfLifeDays) {
          this.setData({ "form.expireDate": "" });
          return;
        }
        this.updateExpireDate();
      }
    });
  },

  clearForm() {
    if (this.clearToastTimer) clearTimeout(this.clearToastTimer);

    this.setData({
      form: createDefaultForm(),
      categoryIndex: 0,
      unitIndex: 0,
      warningRuleModalVisible: false,
      warningRuleDraft: createWarningRuleDraft(),
      clearToastVisible: true,
    });

    this.clearToastTimer = setTimeout(() => {
      this.setData({ clearToastVisible: false });
      this.clearToastTimer = null;
    }, 1500);
  },

  startVoiceInput() {
    this.setData({
      voicePanelVisible: true,
      voiceText: "",
    });
  },

  onVoiceTextInput(e) {
    this.setData({ voiceText: e.detail.value });
  },

  cancelVoiceInput() {
    this.setData({
      voicePanelVisible: false,
      voiceText: "",
    });
  },

  confirmVoiceInput() {
    const text = this.data.voiceText.trim();
    if (!text) {
      wx.showToast({ title: "请输入识别文本", icon: "none" });
      return;
    }

    this.applyVoiceText(text);
    this.cancelVoiceInput();
  },

  applyVoiceText(text) {
    const parsed = parseVoiceText(text);
    const form = this.data.form;
    const nextForm = { ...form };
    const updates = {
      "form.inputType": "voice",
      "form.sourceText": text,
    };
    let filledCount = 0;

    const fillIfEmpty = (field, value) => {
      if (value === undefined || value === null || value === "") return;
      if (form[field]) return;
      const normalizedValue = String(value);
      updates[`form.${field}`] = normalizedValue;
      nextForm[field] = normalizedValue;
      filledCount += 1;
    };

    fillIfEmpty("name", parsed.name);
    fillIfEmpty("category", parsed.category);
    fillIfEmpty("quantity", parsed.quantity);
    fillIfEmpty("unit", parsed.unit);
    fillIfEmpty("purchaseDate", parsed.purchaseDate);
    fillIfEmpty("productionDate", parsed.productionDate);
    fillIfEmpty("shelfLifeDays", parsed.shelfLifeDays);

    if (updates["form.category"]) {
      const categoryIndex = this.data.categories.findIndex(
        (v) => v === updates["form.category"],
      );
      if (categoryIndex > -1) updates.categoryIndex = categoryIndex;
      Object.assign(
        updates,
        buildWarningRuleUpdates("form", updates["form.category"], form),
      );
    }

    if (updates["form.unit"]) {
      const unitIndex = getUnitIndex(this.data.units, updates["form.unit"]);
      updates.unitIndex = unitIndex;
    }

    if (
      nextForm.purchaseDate &&
      nextForm.productionDate &&
      nextForm.productionDate > nextForm.purchaseDate
    ) {
      updates["form.productionDate"] = "";
      updates["form.expireDate"] = "";
      nextForm.productionDate = "";
      nextForm.expireDate = "";
      wx.showToast({ title: "出厂日期不能晚于购买日期", icon: "none" });
    }

    if (nextForm.productionDate && nextForm.shelfLifeDays) {
      const expireDate = calculateExpireDate(
        nextForm.productionDate,
        nextForm.shelfLifeDays,
      );
      updates["form.expireDate"] = expireDate;
      nextForm.expireDate = expireDate;
    }

    this.setData(updates);

    if (!filledCount) {
      wx.showToast({ title: "没有识别到可填字段", icon: "none" });
      return;
    }

    wx.showToast({ title: "已填入识别内容", icon: "success" });
  },

  mockVoiceInput() {
    const today = formatToday();
    const warningRules = getWarningRuleFormData("蛋奶");

    this.setData({
      form: {
        ...this.data.form,
        name: "牛奶",
        category: "蛋奶",
        quantity: "1",
        unit: "盒",
        purchaseDate: today,
        productionDate: today,
        shelfLifeDays: "3",
        ...warningRules,
        expireDate: calculateExpireDate(today, "3"),
        sourceText: "添加牛奶，出厂日期今天，保质期3天",
        inputType: "voice",
      },
      categoryIndex: this.data.categories.findIndex((v) => v === "蛋奶"),
      unitIndex: getUnitIndex(this.data.units, "盒"),
    });
  },

  resetForm() {
    this.setData({
      categoryIndex: 0,
      unitIndex: 0,
      warningRuleModalVisible: false,
      warningRuleDraft: createWarningRuleDraft(),
      form: createDefaultForm(),
    });
  },

  save() {
    const form = this.data.form;

    if (!form.name) {
      wx.showToast({ title: "食材名称不能为空", icon: "none" });
      return;
    }

    if (!form.category) {
      wx.showToast({ title: "请选择分类", icon: "none" });
      return;
    }

    if (!form.quantity || Number(form.quantity) <= 0) {
      wx.showToast({ title: "请输入正确数量", icon: "none" });
      return;
    }

    if (!form.unit) {
      wx.showToast({ title: "请选择单位", icon: "none" });
      return;
    }

    const shelfLifeDays = Number(form.shelfLifeDays);

    if (
      form.shelfLifeDays &&
      (!Number.isInteger(shelfLifeDays) || shelfLifeDays <= 0)
    ) {
      wx.showToast({ title: "请输入正确的保质期天数", icon: "none" });
      return;
    }

    const warningRuleMessage = getWarningRuleValidationMessage(form);
    if (warningRuleMessage) {
      wx.showToast({ title: warningRuleMessage, icon: "none" });
      return;
    }

    if (
      form.purchaseDate &&
      form.productionDate &&
      form.purchaseDate < form.productionDate
    ) {
      wx.showToast({ title: "购买日期不能早于出厂日期", icon: "none" });
      return;
    }

    const expireDate = getResolvedExpireDate(form);
    if (!expireDate) {
      wx.showToast({
        title: "请填写预计到期日期，或补充出厂日期和保质期",
        icon: "none",
      });
      return;
    }

    wx.showLoading({ title: "保存中", mask: true });

    store
      .upsertInventory({
        ...form,
        shelfLifeDays:
          Number.isInteger(shelfLifeDays) && shelfLifeDays > 0
            ? shelfLifeDays
            : "",
        lowRiskDays: Number(form.lowRiskDays),
        mediumRiskDays: Number(form.mediumRiskDays),
        highRiskDays: Number(form.highRiskDays),
        expireDate,
        quantity: Number(form.quantity),
        remainingQuantity: Number(form.quantity),
      })
      .then(() => {
        this.resetForm();
        wx.showToast({ title: "保存成功", icon: "success" });
        setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
      })
      .catch((err) => {
        wx.showToast({ title: err.message || "保存失败", icon: "none" });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },
});
