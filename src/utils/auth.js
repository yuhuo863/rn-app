import * as LocalAuthentication from 'expo-local-authentication'

export const authStatus = {
  isUnlocked: false,
}

/**
 * 生物识别验证工具函数
 * @returns {Promise<boolean>} 验证是否通过
 */
export const performBiometricAuth = async () => {
  try {
    // 1. 检查硬件支持
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const isEnrolled = await LocalAuthentication.isEnrolledAsync()

    // 如果设备不支持生物识别或未录入，建议根据业务需求处理
    // 这里采取安全策略：不支持则提示或改用备用方案，这里简单返回 true (或你可以强制要求系统密码)
    if (!hasHardware || !isEnrolled) {
      console.warn('设备不支持或未录入生物识别')
      return true
    }

    // 2. 执行识别
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: '请验证身份以进入密码箱',
      fallbackLabel: '使用备用密码',
      disableDeviceFallback: false, // 允许在生物识别失败后使用设备锁屏密码
    })

    return result.success
  } catch (error) {
    console.error('生物识别异常:', error)
    return false
  }
}
