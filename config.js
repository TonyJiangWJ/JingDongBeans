'ui';

let currentEngine = engines.myEngine().getSource() + ''
let isRunningMode = currentEngine.endsWith('/config.js')

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
  timeout_unlock: 1000
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

if (!isRunningMode) {
  module.exports = {
    config: config,
    default_config: default_config,
    storage_name: CONFIG_STORAGE_NAME
  }
} else {

  const resetUiValues = function () {
    ui.password.text(config.password)
    ui.showDebugLogChkBox.setChecked(config.show_debug_log)
    ui.saveLogFileChkBox.setChecked(config.saveLogFile)
    ui.timeoutUnlockInpt.text(config.timeout_unlock + '')
    ui.timeoutFindOneInpt.text(config.timeout_findOne + '')
    ui.timeoutExistingInpt.text(config.timeout_existing + '')
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
