let { config } = require('./config.js')
let { runningQueueDispatcher } = require('./lib/RunningQueueDispatcher.js')
runningQueueDispatcher.addRunningTask()
let {
  debugInfo, logInfo, infoLog, warnInfo, errorInfo, clearLogFile
} = require('./lib/LogUtils.js')
let { commonFunctions } = require('./lib/CommonFunction.js')
let { unlocker } = require('./lib/Unlock.js')
let { beanCollector } = require('./core/BeanCollector.js')
logInfo('======校验是否重复运行=======')
// 检查脚本是否重复运行
commonFunctions.checkDuplicateRunning()

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
unlocker.exec()
logInfo('解锁成功')

/************************
 * 主程序
 ***********************/
beanCollector.exec()
runningQueueDispatcher.removeRunningTask()
