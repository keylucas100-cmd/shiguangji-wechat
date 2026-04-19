App({
  onLaunch() {
    if (!wx.cloud) {
      console.warn('Cloud capability is not available in this base library.')
      return
    }

    wx.cloud.init({
      env: wx.cloud.DYNAMIC_CURRENT_ENV,
      traceUser: true
    })
  },
  globalData: {}
})
