/*
 * @Author: TonyJiangWJ
 * @Date: 2019-09-25 16:47:02
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-04-24 08:04:50
 * @Description: 
 */
let { config } = require('./config.js')
let { runningQueueDispatcher } = require('./lib/RunningQueueDispatcher.js')
runningQueueDispatcher.addRunningTask()
let {
  debugInfo, logInfo, infoLog, warnInfo, errorInfo, clearLogFile
} = require('./lib/LogUtils.js')
let { commonFunctions } = require('./lib/CommonFunction.js')
let { unlocker } = require('./lib/Unlock.js')
let { beanCollector } = require('./core/BeanCollector.js')
let { automator } = require('../lib/Automator.js')

/***********************
 * 初始化
 ***********************/
logInfo('======校验无障碍功能======')
// 检查手机是否开启无障碍服务
try {
  auto.waitFor()
} catch (e) {
  warnInfo('auto.waitFor()不可用')
  auto()
}
logInfo('---前置校验完成;启动系统--->>>>')

logInfo('======解锁======')
try {
  unlocker.exec()
} catch (e) {
  errorInfo('解锁发生异常, 三分钟后重新开始' + e)
  commonFunctions.setUpAutoStart(3)
  runningQueueDispatcher.removeRunningTask()
  exit()
}
logInfo('解锁成功')
/************************
 * 主程序
 ***********************/
try {
  commonFunctions.showDialogAndWait(false)
  beanCollector.exec()
  if (config.auto_lock === true && unlocker.needRelock() === true) {
    debugInfo('重新锁定屏幕')
    automator.lockScreen()
  }
} catch (e) {
  errorInfo('执行发生异常' + e)
} finally {
  runningQueueDispatcher.removeRunningTask()
}
