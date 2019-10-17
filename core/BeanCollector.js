let { WidgetUtils } = require('../lib/WidgetUtils.js')
let { automator } = require('../lib/Automator.js')
let { commonFunctions } = require('../lib/CommonFunction.js')
let { config } = require('../config.js')


function BeanCollector () {
  const _package_name = 'com.jingdong.app.mall'

  /***********************
   * 综合操作
   ***********************/

  // 进入京东app
  const startApp = function () {
    logInfo('启动京东应用')
    launch(_package_name)
    sleep(1000)
    let skip = WidgetUtils.widgetGetOne('跳过')
    if (skip !== null) {
      automator.clickCenter(skip)
      sleep(1000)
    }
  }

  const waitingAndGet = function (val) {
    WidgetUtils.widgetWaiting(val)
    return WidgetUtils.widgetGetOne(val)
  }

  const tryEnter = function (preAction, targetContent) {
    let retry = 0
    let target = waitingAndGet(targetContent)
    while (target === null && preAction !== null && retry++ <= 5) {
      automator.clickCenter(preAction)
      sleep(500)
      target = waitingAndGet(targetContent)
    }
    if (target === null) {
      errorInfo(['进入「{}」失败', targetContent], true)
      if (preAction === null) {
        errorInfo('前置操作失败！！！')
      }
    } else {
      infoLog(['进入「{}」成功', targetContent], true)
      automator.clickCenter(target)
    }
    return target
  }


  return {
    exec: function () {
      startApp()
      let mine = waitingAndGet('我的')
      if (mine === null) {
        // 杀死当前APP 仅适用于MIUI10+ 全面屏手势操作
        commonFunctions.killCurrentApp()
        commonFunctions.setUpAutoStart(0.06)
        return
      }
      automator.clickCenter(mine)
      sleep(1000)
      let beens = tryEnter(mine, '京豆')
      let toCollect = tryEnter(beens, '去签到领京豆|已签到')
      let doCollect = tryEnter(toCollect, '签到领京豆|已连续签到')
      let seed = tryEnter(doCollect, '种豆.*')

      let countdown = waitingAndGet('剩\\d{2}:\\d{2}:\\d{2}')
      if (countdown !== null) {
        let countdownInfo = countdown.text()
        let regex = /剩(\d{2}):(\d{2}):(\d{2})/
        if (regex.test(countdownInfo)) {
          let result = regex.exec(countdownInfo)
          let h = result[1]
          let m = result[2]
          let remainTime = parseInt(h) * 60 + parseInt(m) + 1
          commonFunctions.setUpAutoStart(remainTime)
        }
      }
      // 收集能量包，暂时懒得判断是否可收取
      infoLog('点击收集能量包', true)
      automator.click(200, 1200)
      sleep(2000)
    
      let feed = waitingAndGet('培养')
      automator.clickCenter(feed)
      infoLog('完成！' + (countdown != null ? countdown.text() : ''), true)
      home()
      device.setBrightnessMode(1)
    }
  }
}

module.exports = {
  beanCollector: new BeanCollector()
}
