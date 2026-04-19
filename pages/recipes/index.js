const store = require('../../utils/store')
const theme = require('../../utils/theme')

const sortOptions = [
  { key: 'match', text: '按匹配度', shortText: '匹配度' },
  { key: 'time', text: '按耗时', shortText: '耗时' },
  { key: 'easy', text: '按简单优先', shortText: '简单' }
]

function getNames(items) {
  return (items || []).map(item => item.name)
}

function formatNames(items, emptyText) {
  const names = Array.isArray(items) ? items : []
  return names.length ? names.join('、') : emptyText
}

function getScoreLevel(score) {
  if (score >= 80) return 'high'
  if (score >= 40) return 'mid'
  return 'low'
}

function getScoreRingStyle(matchRate) {
  const angle = Math.max(0, Math.min(360, Math.round(Number(matchRate || 0) * 3.6)))
  return `background: conic-gradient(from 0deg, var(--theme-primary, #2fb66d) 0deg, var(--theme-primary, #2fb66d) ${angle}deg, #e5ece8 ${angle}deg, #e5ece8 360deg);`
}

function getRecipeSupplyMeta(item) {
  const missingCount = Array.isArray(item.missing) ? item.missing.length : 0
  if (missingCount === 0) {
    return { text: '完美匹配', className: 'supply-full' }
  }
  if (missingCount <= 2) {
    return { text: `缺少${missingCount}样食材`, className: 'supply-partial' }
  }
  return { text: `还差${missingCount}样`, className: 'supply-low' }
}

function decorateRecipe(item) {
  const matchedNames = getNames(item.matched)
  const missingNames = getNames(item.missing)
  const missingSeasoningNames = getNames(item.missingSeasonings)
  const supplyMeta = getRecipeSupplyMeta(item)
  return {
    ...item,
    matchedText: formatNames(matchedNames, '暂无'),
    missingText: formatNames(missingNames, '无'),
    missingPills: missingNames,
    missingSeasoningText: formatNames(missingSeasoningNames, '无'),
    missingCount: missingNames.length,
    scoreLevel: getScoreLevel(item.matchRate),
    scoreRingStyle: getScoreRingStyle(item.matchRate),
    stepText: `${item.steps.length}步`,
    tagText: item.tags && item.tags.length ? item.tags[0] : item.difficulty,
    supplyText: supplyMeta.text,
    supplyClassName: supplyMeta.className
  }
}

function normalizeSearchText(text) {
  return String(text || '').trim().replace(/\s/g, '').toLowerCase()
}

function recipeMatchesSearch(recipe, keyword) {
  if (!keyword) return true
  const searchText = normalizeSearchText([
    recipe.name,
    recipe.category,
    recipe.difficulty,
    ...(recipe.tags || []),
    ...(recipe.ingredients || []).map(item => item.name),
    ...(recipe.seasonings || []).map(item => item.name),
    recipe.matchedText,
    recipe.missingText
  ].join(' '))
  return searchText.includes(keyword)
}

Page({
  data: {
    themeKey: 'green',
    themeColor: '#2fb66d',
    elderlyMode: false,
    searchText: '',
    sortMode: 'match',
    sortText: '匹配度',
    allRecipes: [],
    list: [],
    detailVisible: false,
    activeRecipe: null
  },
  onShow() {
    const settings = store.getSettings()
    const themeData = theme.getThemeData(settings)
    const allRecipes = store.getRecipeRecommendations().map(decorateRecipe)
    this.setData({
      ...themeData,
      elderlyMode: !!settings.elderlyMode,
      allRecipes
    }, () => {
      this.refreshRecipeList()
    })
  },
  refreshRecipeList() {
    const { allRecipes, searchText, sortMode } = this.data
    const keyword = normalizeSearchText(searchText)
    let list = allRecipes.filter(item => recipeMatchesSearch(item, keyword))

    if (sortMode === 'time') {
      list.sort((a, b) => a.cookTime - b.cookTime || b.score - a.score || a.sortIndex - b.sortIndex)
    } else if (sortMode === 'easy') {
      list.sort((a, b) => {
        const difficultyOrder = { 简单: 0, 中等: 1, 困难: 2 }
        return (difficultyOrder[a.difficulty] || 9) - (difficultyOrder[b.difficulty] || 9) || b.score - a.score || a.sortIndex - b.sortIndex
      })
    } else {
      list.sort((a, b) => b.score - a.score || b.matchRate - a.matchRate || a.cookTime - b.cookTime || a.sortIndex - b.sortIndex)
    }

    this.setData({ list })
  },
  onSearchInput(e) {
    this.setData({ searchText: e.detail.value }, () => {
      this.refreshRecipeList()
    })
  },
  clearSearch() {
    this.setData({ searchText: '' }, () => {
      this.refreshRecipeList()
    })
  },
  showSortSheet() {
    wx.showActionSheet({
      itemList: sortOptions.map(item => item.text),
      success: res => {
        const option = sortOptions[res.tapIndex]
        this.setData({
          sortMode: option.key,
          sortText: option.shortText
        }, () => {
          this.refreshRecipeList()
        })
      }
    })
  },
  showRecipeDetail(e) {
    const recipe = this.data.allRecipes.find(item => item.id === e.currentTarget.dataset.id)
    if (!recipe) return
    this.setData({
      activeRecipe: recipe,
      detailVisible: true
    })
  },
  closeRecipeDetail() {
    this.setData({
      activeRecipe: null,
      detailVisible: false
    })
  },
  noop() {
  }
})
