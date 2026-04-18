const store = require('../../utils/store')
const theme = require('../../utils/theme')

const recipeCategories = ['家常菜', '简餐', '轻食', '汤类', '主食', '早餐']
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

function getCategoryOptions(list) {
  return [
    { key: 'all', text: '全部', count: list.length },
    ...recipeCategories.map(category => ({
      key: category,
      text: category,
      count: list.filter(item => item.category === category).length
    }))
  ]
}

function decorateRecipe(item) {
  const matchedNames = getNames(item.matched)
  const missingNames = getNames(item.missing)
  const missingSeasoningNames = getNames(item.missingSeasonings)
  return {
    ...item,
    matchedText: formatNames(matchedNames, '暂无'),
    missingText: formatNames(missingNames, '无'),
    missingPills: missingNames,
    missingSeasoningText: formatNames(missingSeasoningNames, '无'),
    scoreLevel: getScoreLevel(item.matchRate),
    scoreRingStyle: getScoreRingStyle(item.matchRate),
    stepText: `${item.steps.length}步`,
    tagText: item.tags && item.tags.length ? item.tags[0] : item.difficulty
  }
}

Page({
  data: {
    themeKey: 'green',
    themeColor: '#2fb66d',
    categoryFilter: 'all',
    sortMode: 'match',
    sortText: '匹配度',
    categoryOptions: [],
    allRecipes: [],
    list: [],
    detailVisible: false,
    activeRecipe: null
  },
  onShow() {
    store.syncInventoryFromServer()
      .catch(() => null)
      .finally(() => {
        const settings = store.getSettings()
        const themeData = theme.getThemeData(settings)
        const allRecipes = store.getRecipeRecommendations().map(decorateRecipe)
        this.setData({
          ...themeData,
          allRecipes,
          categoryOptions: getCategoryOptions(allRecipes)
        }, () => {
          this.refreshRecipeList()
        })
      })
  },
  refreshRecipeList() {
    const { allRecipes, categoryFilter, sortMode } = this.data
    let list = categoryFilter === 'all'
      ? [...allRecipes]
      : allRecipes.filter(item => item.category === categoryFilter)

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
  setCategory(e) {
    this.setData({ categoryFilter: e.currentTarget.dataset.category }, () => {
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
