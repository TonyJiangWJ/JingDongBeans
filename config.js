'ui';

let currentEngine = engines.myEngine().getSource() + ''
let isRunningMode = currentEngine.endsWith('/config.js') && typeof module === 'undefined'

importClass(android.text.TextWatcher)
importClass(android.view.View)
importClass(android.view.MotionEvent)
// 执行配置
var default_config = {
  password: '',
  // 是否显示调试日志信息
  show_debug_log: false,
  // 是否toast调试日志
  toast_debug_info: false,
  saveLogFile: true,
  timeout_existing: 6000,
  timeout_findOne: 1000,
  timeout_unlock: 1000,
  device_width: device.width,
  device_height: device.height,
  auto_lock: false,
  lock_x: 150,
  lock_y: 970,
  // 单脚本模式 是否只运行一个脚本 不会同时使用其他的 开启单脚本模式 会取消任务队列的功能。
  // 比如同时使用蚂蚁庄园 则保持默认 false 否则设置为true 无视其他运行中的脚本
  single_script: false,
  // 延迟启动时延 5秒 悬浮窗中进行的倒计时时间
  delayStartTime: 5,
}

// 配置缓存的key值
const CONFIG_STORAGE_NAME = 'jd_config_bean_version'
const PROJECT_NAME = '京东签到'
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

if (!isRunningMode) {
  module.exports = function (__runtime__, scope) {
    if (typeof scope.config_instance === 'undefined') {
      scope.config_instance = {
        config: config,
        default_config: default_config,
        storage_name: CONFIG_STORAGE_NAME,
        project_name: PROJECT_NAME
      }
    }
    return scope.config_instance
  }

} else {
  const _hasRootPermission = files.exists("/sbin/su") || files.exists("/system/xbin/su") || files.exists("/system/bin/su")
  const resetUiValues = function () {
    ui.password.text(config.password)
    ui.showDebugLogChkBox.setChecked(config.show_debug_log)
    ui.saveLogFileChkBox.setChecked(config.saveLogFile)
    ui.timeoutUnlockInpt.text(config.timeout_unlock + '')
    ui.timeoutFindOneInpt.text(config.timeout_findOne + '')
    ui.timeoutExistingInpt.text(config.timeout_existing + '')

    ui.lockX.text(config.lock_x + '')
    ui.lockXSeekBar.setProgress(parseInt(config.lock_x / config.device_width * 100))
    ui.lockY.text(config.lock_y + '')
    ui.lockYSeekBar.setProgress(parseInt(config.lock_y / config.device_height * 100))
    ui.autoLockChkBox.setChecked(config.auto_lock)
    ui.lockPositionContainer.setVisibility(config.auto_lock && !_hasRootPermission ? View.VISIBLE : View.INVISIBLE)
    ui.lockDescNoRoot.setVisibility(!_hasRootPermission ? View.VISIBLE : View.INVISIBLE)
    ui.delayStartTimeInpt.text(config.delayStartTime + '')
    // 进阶配置
    ui.singleScriptChkBox.setChecked(config.single_script)
  }

  threads.start(function () {
    loadingDialog = dialogs.build({
      title: "加载中...",
      progress: {
        max: -1
      },
      cancelable: false
    }).show()
    setTimeout(function () {
      loadingDialog.dismiss()
    }, 3000)
  })

  const TextWatcherBuilder = function (textCallback) {
    return new TextWatcher({
      onTextChanged: (text) => {
        textCallback(text + '')
      },
      beforeTextChanged: function (s) { }
      ,
      afterTextChanged: function (s) { }
    })
  }

  setTimeout(function () {
    ui.layout(
      <drawer>
        <vertical>
          <appbar>
            <toolbar id="toolbar" title="运行配置" />
          </appbar>
          <frame>
            <vertical padding="24 0">
              {/* 锁屏密码 */}
              <horizontal gravity="center">
                <text text="锁屏密码：" />
                <input id="password" inputType="textPassword" layout_weight="80" />
              </horizontal>
              <horizontal w="*" h="1sp" bg="#cccccc" margin="5 0"></horizontal>
              {/* 是否显示debug日志 */}
              <checkbox id="showDebugLogChkBox" text="是否显示debug日志" />
              <checkbox id="saveLogFileChkBox" text="是否保存日志到文件" />
              <horizontal w="*" h="1sp" bg="#cccccc" margin="5 0"></horizontal>
              <horizontal gravity="center">
                <text text="解锁超时（ms）:" />
                <input id="timeoutUnlockInpt" inputType="number" layout_weight="60" />
              </horizontal>
              <horizontal gravity="center">
                <text text="查找控件超时（ms）:" />
                <input id="timeoutFindOneInpt" inputType="number" layout_weight="60" />
              </horizontal>
              <horizontal gravity="center">
                <text text="校验控件是否存在超时（ms）:" />
                <input id="timeoutExistingInpt" inputType="number" layout_weight="60" />
              </horizontal><horizontal w="*" h="1sp" bg="#cccccc" margin="5 0"></horizontal>
              {/* 自动锁屏 */}
              <vertical id="lockDescNoRoot">
                <text text="锁屏功能仅限于下拉状态栏中有锁屏按钮的情况下可用" textSize="12sp" />
                <text text="实在想用可以自行修改Automator中的lockScreen方法" textSize="12sp" />
              </vertical>
              <horizontal gravity="center">
                <checkbox id="autoLockChkBox" text="是否自动锁屏" />
                <vertical padding="10 0" id="lockPositionContainer" gravity="center" layout_weight="75">
                  <horizontal margin="10 0" gravity="center">
                    <text text="x:" />
                    <seekbar id="lockXSeekBar" progress="20" layout_weight="80" />
                    <text id="lockX" />
                  </horizontal>
                  <horizontal margin="10 0" gravity="center">
                    <text text="y:" />
                    <seekbar id="lockYSeekBar" progress="20" layout_weight="80" />
                    <text id="lockY" />
                  </horizontal>
                  <button id="showLockPointConfig" >手动输入坐标</button>
                </vertical>
              </horizontal>
              {/* 单脚本使用，无视多任务队列 */}
              <text text="当需要使用多个脚本时不要勾选（如同时使用我写的蚂蚁庄园脚本），避免抢占前台" textSize="9sp" />
              <checkbox id="singleScriptChkBox" text="是否单脚本运行" />
              {/* 脚本延迟启动 */}
              <horizontal gravity="center">
                <text text="延迟启动时间（秒）:" />
                <input layout_weight="70" inputType="number" id="delayStartTimeInpt" layout_weight="70" />
              </horizontal>
            </vertical>
          </frame>
        </vertical>
      </drawer>
    )
    resetUiValues()
    ui.password.addTextChangedListener(
      TextWatcherBuilder(text => { config.password = text + '' })
    )

    ui.showDebugLogChkBox.on('click', () => {
      config.show_debug_log = ui.showDebugLogChkBox.isChecked()
    })

    ui.saveLogFileChkBox.on('click', () => {
      config.saveLogFile = ui.saveLogFileChkBox.isChecked()
    })


    ui.timeoutUnlockInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.timeout_unlock = parseInt(text) })
    )

    ui.timeoutFindOneInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.timeout_findOne = parseInt(text) })
    )

    ui.timeoutExistingInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.timeout_existing = parseInt(text) })
    )

    ui.autoLockChkBox.on('click', () => {
      let checked = ui.autoLockChkBox.isChecked()
      config.auto_lock = checked
      ui.lockPositionContainer.setVisibility(checked && !_hasRootPermission ? View.VISIBLE : View.INVISIBLE)
    })

    ui.lockXSeekBar.on('touch', () => {
      let precent = ui.lockXSeekBar.getProgress()
      let trueVal = parseInt(precent * config.device_width / 100)
      ui.lockX.text('' + trueVal)
      config.lock_x = trueVal
    })

    ui.lockYSeekBar.on('touch', () => {
      let precent = ui.lockYSeekBar.getProgress()
      let trueVal = parseInt(precent * config.device_height / 100)
      ui.lockY.text('' + trueVal)
      config.lock_y = trueVal
    })

    ui.showLockPointConfig.on('click', () => {
      Promise.resolve().then(() => {
        return dialogs.rawInput('请输入X坐标：', config.lock_x + '')
      }).then(x => {
        if (x) {
          let xVal = parseInt(x)
          if (isFinite(xVal)) {
            config.lock_x = xVal
          } else {
            toast('输入值无效')
          }
        }
      }).then(() => {
        return dialogs.rawInput('请输入Y坐标：', config.lock_y + '')
      }).then(y => {
        if (y) {
          let yVal = parseInt(y)
          if (isFinite(yVal)) {
            config.lock_y = yVal
          } else {
            toast('输入值无效')
          }
        }
      }).then(() => {
        ui.lockX.text(config.lock_x + '')
        ui.lockXSeekBar.setProgress(parseInt(config.lock_x / config.device_width * 100))
        ui.lockY.text(config.lock_y + '')
        ui.lockYSeekBar.setProgress(parseInt(config.lock_y / config.device_height * 100))
      })
    })
    

    ui.singleScriptChkBox.on('click', () => {
      config.single_script = ui.singleScriptChkBox.isChecked()
    })

    ui.delayStartTimeInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.delayStartTime = parseInt(text) })
    )
    setTimeout(() => {
      loadingDialog.dismiss()
    }, 500)
  }, 400)

  ui.emitter.on('pause', () => {
    Object.keys(default_config).forEach(key => {
      let newVal = config[key]
      if (typeof newVal !== 'undefined') {
        configStorage.put(key, newVal)
      } else {
        configStorage.put(key, default_config[key])
      }
    })
    log('修改后配置信息：' + JSON.stringify(config))
  })
}
