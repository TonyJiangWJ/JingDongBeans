/*
 * @Author: TonyJiangWJ
 * @Date: 2019-09-25 16:47:02
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-04-26 18:27:17
 * @Description: 
 */
let { config } = require('./config.js')(runtime, this)
let singletoneRequire = require('./lib/SingletonRequirer.js')(runtime, this)
let runningQueueDispatcher = singletoneRequire('RunningQueueDispatcher')
let { logInfo, errorInfo, warnInfo, debugInfo, infoLog } = singletoneRequire('LogUtils')
let commonFunctions = singletoneRequire('CommonFunction')
let automator = singletoneRequire('Automator')

let unlocker = require('./lib/Unlock.js')

let beanCollector = require('./core/BeanCollector.js')
runningQueueDispatcher.addRunningTask()


/***********************
 * 初始化
 ***********************/
logInfo('======校验无障碍功能======')
// 检查手机是否开启无障碍服务
if (!commonFunctions.checkAccessibilityService()) {
  try {
    auto.waitFor()
  } catch (e) {
    warnInfo('auto.waitFor()不可用')
    auto()
  }
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
function mainExec() {
  commonFunctions.showDialogAndWait(true)
  commonFunctions.listenDelayStart()
  beanCollector.exec()
}

 if (config.develop_mode) {
  mainExec()
} else {
 
  try {
    mainExec()
  
  } catch (e) {
    errorInfo('执行发生异常' + e + ' 三分钟后重启')
    commonFunctions.setUpAutoStart(3)
  }
}

if (config.auto_lock === true && unlocker.needRelock() === true) {
  sleep(500)
  debugInfo('重新锁定屏幕')
  automator.lockScreen()
}
// 清理资源
events.removeAllListeners()
events.recycle()
runningQueueDispatcher.removeRunningTask()

exit()
