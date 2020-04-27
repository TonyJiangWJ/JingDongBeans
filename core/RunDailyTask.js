/*
 * @Author: TonyJiangWJ
 * @Date: 2020-04-28 00:41:51
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-04-28 01:40:08
 * @Description: 
 */

let mrequire = require('../lib/SingletonRequirer.js')(runtime, this)
let { config } = require('../config.js')(runtime, this)

let automator = mrequire('Automator')
let WidgetUtils = mrequire('WidgetUtils')
let logUtils = mrequire('LogUtils')
config.show_debug_log = true

function inShopTask () {
  let inShop = WidgetUtils.widgetGetOne('进店并关注')
  automator.clickCenter(inShop)
  return checkGet()
}

function checkGet () {
  let flag = false
  if (WidgetUtils.widgetCheck('.*个营养液.*')) {
    flag = true
    toastLog('成功获取营养液')
  } else {
    toastLog('获取营养液失败')
  }
  automator.click(800, 1580)
  sleep(500)
  return flag
}

function doShopTasks () {
  sleep(500)
  automator.click(280, 1580)
  let limit = 10
  let count = 0
  while (count < 4 && limit-- > 0) {
    count += inShopTask() ? 1 : 0
    sleep(500)
  }
  logUtils.logInfo(['执行进店任务结束：count {} limit {}', count, limit])
  back()
}

function checkGot () {
  let regex = /x(\d)/
  let gotCount = WidgetUtils.widgetGetOne(regex, null, true)
  if (gotCount) {
    let content = gotCount.content
    return parseInt(regex.exec(content)[1])
  } else {
    return 0
  }
}


//checkGot()

function choseRightGood () {
  sleep(500)
  // 点击右侧商品
  automator.click(830, 1480)
  sleep(1000)
  back()
  sleep(1000)
  automator.swipe(1000, 1000, 300, 1100, 500)
  sleep(500)
}

function doGoodTasks () {
  sleep(1500)
  automator.click(480, 1580)
  let limit = 6
  do {
    choseRightGood()
  } while (checkGot() < 6 && limit-- > 0)
  sleep(500)
  back()
}

function inChannelTask () {
  let inChannel = WidgetUtils.widgetGetOne('进入并关注')
  if (inChannel) {
    automator.clickCenter(inChannel)
    sleep(1500)
    back()
  }
  sleep(500)
  // return checkGet()
}


function doChannelTasks () {
  sleep(1500)
  automator.click(650, 1580)
  let limit = 6
  while (limit-- > 0) {
    inChannelTask()
  }
}

function doMarketTask() {
  sleep(1000)
  automator.click(900, 1860)
  if (WidgetUtils.widgetCheck(/逛逛会场/)) {
    let enter = WidgetUtils.widgetGetOne(/逛逛会场/)
    sleep(1000)
    automator.clickCenter(enter)
    sleep(1500)
    back()
  }
}

if (WidgetUtils.widgetCheck(/每日上限\d+/)) {
  let all = WidgetUtils.widgetGetAll(/x1/)
  if (all && all.length > 0) {
    automator.click(430, 1860)
    sleep(500)
    doShopTasks()
    doGoodTasks()
    doChannelTasks()
    doMarketTask()
    sleep(1000)
    automator.click(600, 1650)
    logUtils.logInfo('任务执行完毕！', true)
  } else {
    logUtils.logInfo('每日任务已完成', true)
  }
}