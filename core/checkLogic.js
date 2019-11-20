
// 执行配置
var default_config = {
  password: '',
  // 是否显示调试日志信息
  show_debug_log: false,
  // 是否toast调试日志
  toast_debug_info: false,
  // 是否在收集完成后根据收集前状态判断是否锁屏，非ROOT设备通过下拉状态栏中的锁屏按钮实现 需要配置锁屏按钮位置
  auto_lock: true,
  timeout_existing: 1000,
  timeout_findOne: 1000,
  timeout_unlock: 1000
}
/**
 * 非可视化控制的配置 通过手动修改config.js来实现配置
 */
let no_gui_config = {
  saveLogFile: true
}

// UI配置
var ui_config = {
}

// 配置缓存的key值
const CONFIG_STORAGE_NAME = 'jd_config_bean_version'
var configStorage = storages.create(CONFIG_STORAGE_NAME)
var config = {}
if (!configStorage.contains('password')) {
  toastLog('使用默认配置')
  // 存储默认配置到本地
  Object.keys(default_config).forEach(key => {
    configStorage.put(key, default_config[key])
  })
  config = default_config
} else {
  Object.keys(default_config).forEach(key => {
    let storedConfigItem = configStorage.get(key)
    if (storedConfigItem === undefined) {
      storedConfigItem = default_config[key]
    }
    config[key] = storedConfigItem
  })
}
// UI配置直接设置到storages
Object.keys(ui_config).forEach(key => {
  config[key] = ui_config[key]
})
// 非可视化配置
Object.keys(no_gui_config).forEach(key => {
  config[key] = no_gui_config[key]
})

var commonFunctions = new CommonFunctions()




function CommonFunctions () {

  this.commonDelay = function (minutes, text) {
    debugInfo('倒计时' + minutes)
    if (typeof text === 'undefined' || text === '') {
      text = '距离下次运行还有['
    }

    minutes = typeof minutes != null ? minutes : 0
    if (minutes === 0) {
      return
    }
    let startTime = new Date().getTime()
    let timestampGap = minutes * 60000
    let i = 0
    let delayLogStampPoint = -1
    let delayLogGap = 0
    for (; ;) {
      let now = new Date().getTime()
      if (now - startTime > timestampGap) {
        break
      }
      i = (now - startTime) / 60000
      let left = minutes - i
      delayLogGap = i - delayLogStampPoint
      // 半分钟打印一次日志
      if (delayLogGap >= 0.5) {
        delayLogStampPoint = i
        // this.showTextFloaty(text + left.toFixed(2) + ']分')
        debugInfo(text + left.toFixed(2) + ']分')
      }
      sleep(500)
    }
  }


  this.isEmpty = function (val) {
    return val === null || typeof val === 'undefined' || val === ''
  }

  this.isEmptyArray = function (array) {
    return array === null || typeof array === 'undefined' || array.length === 0
  }

  this.addOpenPlacehold = function (content) {
    content = "<<<<<<<" + (content || "") + ">>>>>>>"
    appendLog(content)
    console.verbose(content)
  }

  this.addClosePlacehold = function (content) {
    content = ">>>>>>>" + (content || "") + "<<<<<<<"
    appendLog(content)
    console.verbose(content)
  }

  /**
   * 校验是否重复运行 如果重复运行则关闭当前脚本
   */
  this.checkDuplicateRunning = function () {
    let currentEngine = engines.myEngine()
    let runningEngines = engines.all()
    let runningSize = runningEngines.length
    let currentSource = currentEngine.getSource() + ''
    debugInfo('当前脚本信息 id:' + currentEngine.id + ' source:' + currentSource + ' 运行中脚本数量：' + runningSize)
    if (runningSize > 1) {
      runningEngines.forEach(engine => {
        let compareEngine = engine
        let compareSource = compareEngine.getSource() + ''
        debugInfo('对比脚本信息 id:' + compareEngine.id + ' source:' + compareSource)
        if (currentEngine.id !== compareEngine.id && compareSource === currentSource) {
          warnInfo('脚本正在运行中 退出当前脚本：' + currentSource, true)
          engines.myEngine().forceStop()
          exit()
        }
      })
    }
  }

  /**
   * 关闭运行中的脚本
   */
  this.killRunningScript = function () {
    let runningEngines = engines.all()
    let runningSize = runningEngines.length
    let mainScriptJs = FileUtils.getRealMainScriptPath()
    if (runningSize > 1) {
      runningEngines.forEach(engine => {
        let compareEngine = engine
        let compareSource = compareEngine.getSource() + ''
        debugInfo('对比脚本信息 id:' + compareEngine.id + ' source:' + compareSource)
        if (compareSource === mainScriptJs) {
          warnInfo(['关闭运行中脚本：id[{}]', compareEngine.id], true)
          engine.forceStop()
        }
      })
    }
  }

  /**
   * 设置指定时间后自动启动main脚本
   */
  this.setUpAutoStart = function (minutes) {
    let mainScriptJs = FileUtils.getRealMainScriptPath()
    let millis = new Date().getTime() + minutes * 60 * 1000;
    infoLog('预订[' + minutes + ']分钟后的任务，时间戳:' + millis)
    // 预定一个{minutes}分钟后的任务
    let task = Timers.addDisposableTask({
      path: mainScriptJs,
      date: millis
    })
    debugInfo("定时任务预定成功: " + task.id);
  }

  this.waitFor = function (action, timeout) {
    let countDown = new java.util.concurrent.CountDownLatch(1)
    let timeoutThread = threads.start(function () {
      sleep(timeout)
      countDown.countDown()
      debugInfo('超时线程执行结束')
    })
    let actionSuccess = false
    let actionThread = threads.start(function () {
      action()
      actionSuccess = true
      countDown.countDown()
      debugInfo('action执行结束')
    })
    countDown.await()
    timeoutThread.interrupt()
    actionThread.interrupt()
    return actionSuccess
  }

  this.createQueue = function (size) {
    let queue = []
    for (let i = 0; i < size; i++) {
      queue.push(i)
    }
    return queue
  }

  this.getQueueDistinctSize = function (queue) {
    return queue.reduce((a, b) => {
      if (a.indexOf(b) < 0) {
        a.push(b)
      }
      return a
    }, []).length
  }

  this.pushQueue = function (queue, size, val) {
    if (queue.length >= size) {
      queue.shift()
    }
    queue.push(val)
  }

  /**
   * 杀死当前APP 仅适用于MIUI10+ 全面屏手势操作
   */
  this.killCurrentApp = function () {
    recents()
    sleep(1000)
    gesture(320, [240, 1000], [800, 1000])
  }

  /**
  * eg. params ['参数名：{} 参数内容：{}', name, value]
  *     result '参数名：name 参数内容：value'
  * 格式化字符串，定位符{}
  */
  this.formatString = function () {
    let originContent = []
    for (let arg in arguments) {
      originContent.push(arguments[arg])
    }
    if (originContent.length === 1) {
      return originContent[0]
    }
    console.log(JSON.stringify(originContent))
    let marker = originContent[0]
    let args = originContent.slice(1)
    let regex = /(\{\})/g
    let matchResult = marker.match(regex)
    if (matchResult && args && matchResult.length > 0 && matchResult.length === args.length) {
      args.forEach((item, idx) => {
        marker = marker.replace('{}', item)
      })
      return marker
    } else {
      console.error('参数数量不匹配' + arguments)
      return arguments
    }
  }
}









/**
 * 校验控件是否存在，并打印相应日志
 * @param {String} contentVal 控件文本
 * @param {String} position 日志内容 当前所在位置是否成功进入
 * @param {Number} timeoutSetting 超时时间 默认为config.timeout_existing
 */
const widgetWaiting = function (contentVal, position, timeoutSetting) {
  position = position || contentVal
  let waitingSuccess = widgetCheck(contentVal, timeoutSetting)

  if (waitingSuccess) {
    debugInfo('成功进入' + position)
    return true
  } else {
    errorInfo('进入' + position + '失败')
    return false
  }
}

/**
 * 校验控件是否存在
 * @param {String} contentVal 控件文本
 * @param {Number} timeoutSetting 超时时间 不设置则为config.timeout_existing
 * 超时返回false
 */
const widgetCheck = function (contentVal, timeoutSetting) {
  let timeout = timeoutSetting || config.timeout_existing
  let timeoutFlag = true
  let countDown = new java.util.concurrent.CountDownLatch(1)
  let descThread = threads.start(function () {
    descMatches(contentVal).waitFor()
    let res = descMatches(contentVal).findOne().desc()
    debugInfo('find desc ' + contentVal + " " + res)
    timeoutFlag = false
    countDown.countDown()
  })

  let textThread = threads.start(function () {
    textMatches(contentVal).waitFor()
    let res = textMatches(contentVal).findOne().text()
    debugInfo('find text ' + contentVal + "  " + res)
    timeoutFlag = false
    countDown.countDown()
  })

  let timeoutThread = threads.start(function () {
    sleep(timeout)
    countDown.countDown()
  })
  countDown.await()
  descThread.interrupt()
  textThread.interrupt()
  timeoutThread.interrupt()
  return !timeoutFlag
}


/**
 * 根据内容获取一个对象
 * 
 * @param {string} contentVal 
 * @param {number} timeout 
 * @param {boolean} containType 是否带回类型
 */
const widgetGetOne = function (contentVal, timeout, containType) {
  let target = null
  let isDesc = false
  let waitTime = timeout || config.timeout_findOne
  let timeoutFlag = true
  if (textMatches(contentVal).exists()) {
    debugInfo('text ' + contentVal + ' found')
    target = textMatches(contentVal).findOne(waitTime)
    timeoutFlag = false
  } else if (descMatches(contentVal).exists()) {
    isDesc = true
    debugInfo('desc ' + contentVal + ' found')
    target = descMatches(contentVal).findOne(waitTime)
    timeoutFlag = false
  } else {
    debugInfo('none of text or desc found for ' + contentVal)
  }
  // 当需要带回类型时返回对象 传递target以及是否是desc
  if (target && containType) {
    let result = {
      target: target,
      isDesc: isDesc
    }
    return result
  }
  if (timeoutFlag) {
    warnInfo('timeout for finding ' + contentVal)
  }
  return target
}

/**
 * 根据内容获取所有对象的列表
 * 
 * @param {string} contentVal 
 * @param {number} timeout 
 * @param {boolean} containType 是否传递类型
 */
const widgetGetAll = function (contentVal, timeout, containType) {
  let target = null
  let isDesc = false
  let timeoutFlag = true
  let countDown = new java.util.concurrent.CountDownLatch(1)
  let waitTime = timeout || config.timeout_findOne
  let findThread = threads.start(function () {
    if (textMatches(contentVal).exists()) {
      debugInfo('text ' + contentVal + ' found')
      target = textMatches(contentVal).untilFind()
      timeoutFlag = false
    } else if (descMatches(contentVal).exists()) {
      isDesc = true
      debugInfo('desc ' + contentVal + ' found')
      target = descMatches(contentVal).untilFind()
      timeoutFlag = false
    } else {
      debugInfo('none of text or desc found for ' + contentVal)
    }
    countDown.countDown()
  })
  let timeoutThread = threads.start(function () {
    sleep(waitTime)
    countDown.countDown()
    warnInfo('timeout for finding ' + contentVal)
  })
  countDown.await()
  findThread.interrupt()
  timeoutThread.interrupt()
  if (timeoutFlag && !target) {
    return null
  } else if (target && containType) {
    let result = {
      target: target,
      isDesc: isDesc
    }
    return result
  }
  return target
}

/**
 * 快速下滑 
 * @deprecated 不再使用 本用来统计最短时间 现在可以先直接加载全部列表然后获取
 */
const quickScrollDown = function () {
  do {
    _automator.scrollDown(50)
    sleep(50)
  } while (
    !foundNoMoreWidget()
  )
}



function DateUtil () {
  return {
    formatDate: function (date, fmt) {
      if (typeof fmt === 'undefined') {
        fmt = "yyyy-MM-dd HH:mm:ss"
      }

      var o = {
        'M+': date.getMonth() + 1, // 月份
        'd+': date.getDate(), // 日
        'h+': date.getHours() % 12 === 0 ? 12 : date.getHours() % 12, // 小时
        'H+': date.getHours(), // 小时
        'm+': date.getMinutes(), // 分
        's+': date.getSeconds(), // 秒
        'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
        'S': date.getMilliseconds() // 毫秒
      }
      var week = {
        '0': '\u65e5',
        '1': '\u4e00',
        '2': '\u4e8c',
        '3': '\u4e09',
        '4': '\u56db',
        '5': '\u4e94',
        '6': '\u516d'
      }
      if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
      }
      if (/(E+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? '\u661f\u671f' : '\u5468') : '') + week[date.getDay() + ''])
      }
      for (var k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
          fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
        }
      }
      return fmt
    }
  }
}
let formatDate = new DateUtil().formatDate
const getRealMainScriptPath = function (parentDirOnly) {
  let currentPath = files.cwd()
  if (files.exists(currentPath + '/main.js')) {
    return currentPath + (parentDirOnly ? '' : '/main.js')
  }
  let paths = currentPath.split('/') || []

  do {
    paths = paths.slice(0, paths.length - 1)
    if (paths.length > 1)
      currentPath = paths.reduce((a, b) => a += '/' + b)
  } while (!files.exists(currentPath + '/main.js') && paths.length > 0);
  if (paths.length > 0) {
    return currentPath + (parentDirOnly ? '' : '/main.js')
  }
}

/**
 * 获取当前脚本的运行工作路径，main.js所在的文件夹
 */
const getCurrentWorkPath = function () {
  return getRealMainScriptPath(true)
}

let FileUtils = {
  getRealMainScriptPath: getRealMainScriptPath,
  getCurrentWorkPath: getCurrentWorkPath
}

let storage = storages.create('run_log_file')
/**
 * @param {string} content 
 * @param {boolean} isToast 
 */
const showToast = function (content, logFunc, isToast, appendLog) {
  content = convertObjectContent(content)
  if (isToast) {
    toast(content)
  }
  innerAppendLog(content, appendLog)
  logFunc(content)
}

const innerClearLogFile = function () {
  let mainScriptPath = FileUtils.getRealMainScriptPath(true) + '/logs'
  clearTarget(mainScriptPath, mainScriptPath + '/log-verboses.log', 'log-verboses')
  clearTarget(mainScriptPath, mainScriptPath + '/error.log', 'error')
  clearTarget(mainScriptPath, mainScriptPath + '/log.log', 'log')
  clearTarget(mainScriptPath, mainScriptPath + '/warn.log', 'warn')
  clearTarget(mainScriptPath, mainScriptPath + '/info.log', 'info')

}

const clearTarget = function (parentPath, filePath, fileName) {
  if (files.exists(filePath)) {
    let timestampLastHour = new Date().getTime() - 3600000
    let backLogPath = parentPath + '/logback/' + fileName + '.' + formatDate(new Date(timestampLastHour), 'yyyyMMddHHmm') + '.log'
    files.ensureDir(parentPath + '/logback/')
    console.info('备份日志文件[' + backLogPath + ']' + (files.move(filePath, backLogPath) ? '成功' : '失败'))
  } else {
    console.info(filePath + '不存在，不执行备份')
  }
  try {
    files.write(filePath, fileName + ' logs for [' + formatDate(new Date()) + ']\n')
  } catch (e) {
    console.error('初始化写入日志文件失败' + e)
  }
}

const innerAppendLog = function (content, appendAnother) {
  if (config.saveLogFile) {

    // 每个整点备份日志
    let compareDateTime = formatDate(new Date(), 'yyyyMMddHH')
    let last_back_file = storage.get('last_back_file')
    if (compareDateTime !== last_back_file) {
      storage.put('last_back_file', compareDateTime)
      innerClearLogFile()
    }
    let string = formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss.S') + ':' + content + '\n'
    files.ensureDir(FileUtils.getRealMainScriptPath(true) + '/logs/')
    let logFilePath = FileUtils.getRealMainScriptPath(true) + '/logs/log-verboses.log'
    try {
      files.append(logFilePath, string)
    } catch (e) {
      console.error('写入日志信息失败' + e)
    }

    if (appendAnother) {
      try {
        appendAnother(string)
      } catch (e) {
        console.error('写入额外日志文件失败' + e)
      }
    }
  }
}


function convertObjectContent (originContent) {
  if (typeof originContent === 'string') {
    return originContent
  } else if (Array.isArray(originContent)) {
    // let [marker, ...args] = originContent
    let marker = originContent[0]
    let args = originContent.slice(1)
    let regex = /(\{\})/g
    let matchResult = marker.match(regex)
    if (matchResult && args && matchResult.length > 0 && matchResult.length === args.length) {
      args.forEach((item, idx) => {
        marker = marker.replace('{}', item)
      })
      return marker
    } else if (matchResult === null) {
      return marker
    }
  }
  console.error('参数不匹配[' + originContent + ']')
  return originContent
}


let LogUtils = {
  debugInfo: function (content, isToast) {
    if (config.show_debug_info) {
      showToast(content, (c) => console.verbose(c), isToast)
    } else {
      content = convertObjectContent(content)
      innerAppendLog(content)
    }
  },
  logInfo: function (content, isToast) {
    showToast(content, (c) => console.log(c), isToast,
      (string) => {
        let filePath = FileUtils.getRealMainScriptPath(true) + '/logs/log.log'
        files.append(filePath, string)
      }
    )
  },
  infoLog: function (content, isToast) {
    showToast(content, (c) => console.info(c), isToast,
      (string) => {
        let filePath = FileUtils.getRealMainScriptPath(true) + '/logs/info.log'
        files.append(filePath, string)
      }
    )
  },
  warnInfo: function (content, isToast) {
    showToast(content, (c) => console.warn(c), isToast,
      (string) => {
        let filePath = FileUtils.getRealMainScriptPath(true) + '/logs/warn.log'
        files.append(filePath, string)
      }
    )
  }
  ,
  errorInfo: function (content, isToast) {
    showToast(content, (c) => console.error(c), isToast,
      (string) => {
        let filePath = FileUtils.getRealMainScriptPath(true) + '/logs/error.log'
        files.append(filePath, string)
      }
    )
  },
  appendLog: innerAppendLog,
  clearLogFile: innerClearLogFile
}
let {
  debugInfo, logInfo, infoLog, warnInfo, errorInfo, clearLogFile
} = LogUtils

const hasRootPermission = function () {
  return files.exists("/sbin/su") || files.exists("/system/xbin/su") || files.exists("/system/bin/su")
}

function Automation_root () {
  this.check_root = function () {
    if (!(files.exists("/sbin/su") || files.exists("/system/xbin/su") || files.exists("/system/bin/su"))) throw new Error("未获取ROOT权限")
  }

  this.click = function (x, y) {
    this.check_root()
    return (shell("input tap " + x + " " + y, true).code === 0)
  }

  this.swipe = function (x1, y1, x2, y2, duration) {
    this.check_root()
    return (shell("input swipe " + x1 + " " + y1 + " " + x2 + " " + y2 + " " + duration, true).code === 0)
  }

  this.gesture = function (duration, points) {
    this.check_root()
    let len = points.length,
      step = duration / len,
      start = points.shift()

    // 使用 RootAutomator 模拟手势，仅适用于安卓5.0及以上
    let ra = new RootAutomator()
    ra.touchDown(start[0], start[1])
    sleep(step)
    points.forEach(function (el) {
      ra.touchMove(el[0], el[1])
      sleep(step)
    })
    ra.touchUp()
    ra.exit()
    return true
  }

  this.back = function () {
    this.check_root()
    return (shell("input keyevent KEYCODE_BACK", true).code === 0)
  }

  this.lockScreen = function () {
    return (shell("input keyevent 26", true).code === 0)
  }

  this.scrollDown = function (speed) {
    let millis = speed || 500
    let deviceHeight = device.height || 1900
    let bottomHeight = config.bottomHeight || 250
    swipe(400, deviceHeight - bottomHeight, 600, 200, millis)
  }

  this.clickBack = function () {
    if (descEndsWith('返回').exists()) {
      descEndsWith('返回')
        .findOne(config.timeout_findOne)
        .click()
    } else if (textEndsWith('返回').exists()) {
      textEndsWith('返回')
        .findOne(config.timeout_findOne)
        .click()
    }
    sleep(200)
  }

  this.clickClose = function () {
    if (descEndsWith('关闭').exists()) {
      descEndsWith('关闭')
        .findOne(config.timeout_findOne)
        .click()
    } else if (textEndsWith('关闭').exists()) {
      textEndsWith('关闭')
        .findOne(config.timeout_findOne)
        .click()
    }
  }

  this.enterFriendList = function () {
    if (descEndsWith('查看更多好友').exists()) {
      descEndsWith('查看更多好友')
        .findOne(config.timeout_findOne)
        .click()
    } else if (textEndsWith('查看更多好友').exists()) {
      textEndsWith('查看更多好友')
        .findOne(config.timeout_findOne)
        .click()
    }
    sleep(200)
  }
}

function Automation () {

  this.click = function (x, y) {
    return click(x, y)
  }

  this.swipe = function (x1, y1, x2, y2, duration) {
    return swipe(x1, y1, x2, y2, duration)
  }

  this.gesture = function (duration, points) {
    return gesture(duration, points)
  }

  this.back = function () {
    return back()
  }

  /**
   * 下拉状态栏，点击锁屏按钮
   */
  this.lockScreen = function () {
    swipe(500, 10, 500, 1000, 500)
    swipe(500, 10, 500, 1000, 500)
    // 点击锁屏按钮
    click(parseInt(config.lock_x), parseInt(config.lock_y))
  }

  this.scrollDown = function (speed) {
    let millis = speed || 500
    let deviceHeight = device.height || 1900
    let bottomHeight = config.bottomHeight || 250
    swipe(400, deviceHeight - bottomHeight, 600, 200, millis)
  }

  this.clickBack = function () {
    if (descEndsWith('返回').exists()) {
      descEndsWith('返回')
        .findOne(config.timeout_findOne)
        .click()
    } else if (textEndsWith('返回').exists()) {
      textEndsWith('返回')
        .findOne(config.timeout_findOne)
        .click()
    }
    sleep(200)
  }

  this.clickClose = function () {
    if (descEndsWith('关闭').exists()) {
      descEndsWith('关闭')
        .findOne(config.timeout_findOne)
        .click()
    } else if (textEndsWith('关闭').exists()) {
      textEndsWith('关闭')
        .findOne(config.timeout_findOne)
        .click()
    }
  }

  this.enterFriendList = function () {
    if (descEndsWith('查看更多好友').exists()) {
      descEndsWith('查看更多好友')
        .findOne(config.timeout_findOne)
        .click()
    } else if (textEndsWith('查看更多好友').exists()) {
      textEndsWith('查看更多好友')
        .findOne(config.timeout_findOne)
        .click()
    }
    sleep(200)
  }
}

const _automator = (device.sdkInt < 24 || hasRootPermission()) ? new Automation_root() : new Automation()

let automator = {
  click: function (x, y) {
    return _automator.click(x, y)
  },
  clickCenter: function (obj) {
    if (obj !== null) {
      return _automator.click(obj.bounds().centerX(), obj.bounds().centerY())
    } else {
      errorInfo('无法点击目标')
    }
  },
  swipe: function (x1, y1, x2, y2, duration) {
    return _automator.swipe(x1, y1, x2, y2, duration)
  },
  gesture: function (duration, points) {
    return _automator.gesture(duration, points)
  },
  back: function () {
    return _automator.back()
  },
  lockScreen: function () {
    return _automator.lockScreen()
  },
  scrollDown: function (speed) {
    if (config.useCustomScrollDown) {
      return _automator.scrollDown(speed)
    } else {
      return scrollDown()
    }
  },
  clickBack: function () {
    return _automator.clickBack()
  },
  clickClose: function () {
    return _automator.clickClose()
  },
  enterFriendList: function () {
    return _automator.enterFriendList()
  }
}

// let f31 = widgetGetOne('每日上限31')
// automator.clickCenter(f31)
// sleep(1000)
// automator.back()
// sleep(1000)

// let lose = widgetGetOne('.*营养液走丢了.*|.*个营养液')
//   if (lose) {
//     let content = lose.text() || lose.desc()
//     let getFailed = content.match(/走丢了/)
//     toastLog(getFailed ? '走丢了' : '得到一瓶')
//     // countSelected += getFailed ? 0 : 1
//   }
// exit()
let forces = widgetGetAll('每日上限10')
let target = null
if (forces && forces.length > 1) {
  target = forces[0]
  toastLog('find 关注任务 ' + target.bounds())
} else {
  toastLog('任务识别失败')
  exit()
}
automator.clickCenter(target)
sleep(1000)
let viewShop = widgetGetOne('每日上限4')
toastLog('find 每日上限4' + viewShop.bounds())
automator.clickCenter(viewShop)
sleep(1500)
let tryTime = 0
let countSelected = 0
while (tryTime++ <= 10 && countSelected < 4) {
  let inShop = widgetGetOne('进店并关注')
  if (inShop) {
    toastLog('find 进店并关注' + inShop.bounds())
    automator.clickCenter(inShop)
    sleep(1000)
  }
  sleep(1500)
  let lose = widgetGetOne('.*营养液走丢了.*|.*个营养液')
  if (lose) {
    let content = lose.text() || lose.desc()
    let getFailed = content.match(/走丢了/)
    toastLog(getFailed ? '走丢了' : '得到一瓶')
    countSelected += getFailed ? 0 : 1
  }
  sleep(1500)
  automator.back()
  sleep(1000)
}
toastLog('finally ' + countSelected)
automator.back()
sleep(1000)
forces = widgetGetAll('每日上限10')
target = forces[0]
toastLog('find 关注任务 ' + target.bounds())
automator.clickCenter(target)
sleep(1000)

let viewGoods = widgetGetOne('每日上限6')
if (viewGoods) {
  automator.clickCenter(viewGoods)
  sleep(1000)
}

let count = 0
while (count++ <= 6) {
  automator.click(800, 1450)
  sleep(1000)
  automator.back()
  sleep(1000)
  gesture(200, [875, 1300], [400, 1350])
  sleep(1000)
}

automator.back()
sleep(1000)
let p = widgetGetOne('培养')
automator.clickCenter(p)
