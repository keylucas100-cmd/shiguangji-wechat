const store = require('../../utils/store')
const theme = require('../../utils/theme')

const coreMetricConfig = [
  {
    key: 'utilizationRate',
    label: '库存消耗率',
    desc: '已使用食材占全部记录的比例',
    color: '#66bd6d',
    track: '#eaf5eb'
  },
  {
    key: 'reminderHandleRate',
    label: '提醒处理率',
    desc: '临期、过期提醒被处理的比例',
    color: '#46b8aa',
    track: '#e8f7f5'
  },
  {
    key: 'wasteControlRate',
    label: '浪费控制率',
    desc: '未浪费食材占全部记录的比例',
    color: '#d9d95a',
    track: '#f7f7df'
  }
]

function getRingStyle(value, color, track) {
  return `background: conic-gradient(${color} ${value}%, ${track} 0);`
}

function buildViewData(stats) {
  const coreMetrics = coreMetricConfig.map(item => {
    const value = stats[item.key] || 0
    return {
      ...item,
      value,
      ringStyle: getRingStyle(value, item.color, item.track)
    }
  })

  return {
    coreMetrics,
    weeklyItems: [
      { label: '本周新增食材', value: stats.weekly.added, unit: '样' },
      { label: '已使用', value: stats.weekly.used, unit: '样' },
      { label: '已过期', value: stats.weekly.expired, unit: '样' },
      { label: '丢弃', value: stats.weekly.discarded, unit: '样' }
    ],
    trendItems: [
      { label: '库存消耗率', ...stats.trends.utilization },
      { label: '提醒处理率', ...stats.trends.reminder },
      { label: '浪费率', ...stats.trends.waste }
    ]
  }
}

Page({
  data: {
    themeKey: 'green',
    themeColor: '#2fb66d',
    stats: {
      total: 0,
      used: 0,
      expired: 0,
      discarded: 0,
      riskStages: {
        lowRisk: 0,
        mediumRisk: 0,
        highRisk: 0,
        expired: 0
      },
      utilizationRate: 0,
      reminderHandleRate: 0,
      wasteRate: 0,
      wasteControlRate: 0,
      weekly: {
        added: 0,
        used: 0,
        expired: 0,
        discarded: 0,
        wasteRate: 0
      },
      trends: {
        utilization: { text: '持平 0%', className: 'neutral' },
        reminder: { text: '持平 0%', className: 'neutral' },
        waste: { text: '持平 0%', className: 'neutral' }
      }
    },
    coreMetrics: [],
    weeklyItems: [],
    trendItems: []
  },
  onShow() {
    this.setData(theme.getThemeData(store.getSettings()))
    if (this.refreshTimer) clearTimeout(this.refreshTimer)
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null
      this.refreshStats()
    }, 0)
  },
  onUnload() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  },
  refreshStats() {
    store.syncInventoryFromServer()
      .catch(() => null)
      .finally(() => {
        const stats = store.getStats()
        this.setData({
          stats,
          ...buildViewData(stats)
        })
      })
  }
})
