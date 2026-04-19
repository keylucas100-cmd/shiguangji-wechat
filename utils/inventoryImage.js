const DETAIL_IMAGE_RULES = [
  {
    pattern: /(牛奶|酸奶|奶酪|芝士|黄油|奶油|奶粉|乳酪|奶)/,
    image: "/assets/inventory/detail/milk.jpg",
  },
  {
    pattern: /(鸡蛋|鸭蛋|鹅蛋|鹌鹑蛋|蛋)/,
    image: "/assets/inventory/detail/egg.jpg",
  },
  {
    pattern: /(虾仁|基围虾|明虾|河虾|海虾|虾)/,
    image: "/assets/inventory/detail/shrimp.jpg",
  },
  {
    pattern: /(螃蟹|蟹肉|梭子蟹|大闸蟹|蟹)/,
    image: "/assets/inventory/detail/crab.jpg",
  },
  {
    pattern: /(三文鱼|黄鱼|带鱼|鲈鱼|鳕鱼|鲫鱼|鲤鱼|鲳鱼|鱼)/,
    image: "/assets/inventory/detail/fish.jpg",
  },
  {
    pattern: /(羊排|羊腿|羊肉|羊)/,
    image: "/assets/inventory/detail/lamb.jpg",
  },
  {
    pattern: /(五花肉|里脊肉|排骨|猪肉|猪)/,
    image: "/assets/inventory/detail/pig.jpg",
  },
  {
    pattern: /(牛腩|牛排|肥牛|牛肉|牛)/,
    image: "/assets/inventory/detail/beef.jpg",
  },
  {
    pattern: /(鸡胸肉|鸡腿|鸡翅|鸡肉|鸡)/,
    image: "/assets/inventory/detail/chicken.jpg",
  },
];

const COMMON_IMAGE_MAP = {
  蔬菜: "/assets/inventory/common-food/vegetables.jpg",
  肉类: "/assets/inventory/common-food/meat.jpg",
  海鲜: "/assets/inventory/common-food/seafood.jpg",
  蛋奶: "/assets/inventory/common-food/egg-milk.jpg",
  水果: "/assets/inventory/common-food/fruit.jpg",
  主食: "/assets/inventory/common-food/rice.jpg",
  调料: "/assets/inventory/common-food/flavour.jpg",
  其他: "/assets/inventory/common-food/other.jpg",
};

function getInventoryImage(name, category) {
  const text = String(name || "");
  const detailRule = DETAIL_IMAGE_RULES.find((rule) => rule.pattern.test(text));
  if (detailRule) return detailRule.image;

  return COMMON_IMAGE_MAP[category] || COMMON_IMAGE_MAP.其他;
}

module.exports = {
  getInventoryImage,
};
