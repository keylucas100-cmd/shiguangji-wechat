const themeOptions = [
  {
    key: 'green',
    name: '清新绿',
    color: '#2fb66d'
  },
  {
    key: 'orange',
    name: '暖橙',
    color: '#f29b38'
  },
  {
    key: 'coral',
    name: '珊瑚粉',
    color: '#ef7f68'
  },
  {
    key: 'mint',
    name: '薄荷青',
    color: '#35b8a6'
  }
]

function getTheme(themeKey) {
  return themeOptions.find(item => item.key === themeKey) || themeOptions[0]
}

function getThemeData(settings) {
  const theme = getTheme(settings && settings.themeKey)
  return {
    themeKey: theme.key,
    themeColor: theme.color
  }
}

module.exports = {
  themeOptions,
  getTheme,
  getThemeData
}
