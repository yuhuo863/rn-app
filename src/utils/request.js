import axios from 'axios'
import { Alert } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const apiService = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
})

const TOKEN_KEY = 'userToken'

apiService.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY)

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

apiService.interceptors.response.use(
  (response) => {
    // 假设后端返回的数据结构是 { code: 0, message: "OK", data: {...} }
    const { code, data, message } = response.data

    // 统一处理业务成功
    if (code === 200 || code === 201) {
      return data
    }

    // --- 统一处理业务错误码 ---

    // 示例: 401: Token 失效或过期
    if (code === 401) {
      Alert.alert('登录过期', '您的登录信息已失效，请重新登录。')
      // 可以在这里触发全局的登出操作，例如导航到登录页
      // navigation.navigate('Login');
    }

    // 示例: 其他业务错误
    else if (code !== 200 && code !== 201) {
      Alert.alert('请求失败', message || '未知错误')
    }

    // 阻止Promise链继续执行到业务组件的 .then()
    return Promise.reject(new Error(message || '服务器业务错误'))
  },
  (error) => {
    // --- 统一处理 HTTP 错误 (非 2xx 状态码) ---

    let errorMessage = '网络错误，请稍后重试。'

    if (error.response) {
      // 请求已发出，但状态码不在 2xx 的范围
      const status = error.response.status
      switch (status) {
        case 404:
          errorMessage = '请求的资源不存在 (404)'
          break
        case 500:
          errorMessage = '服务器内部错误 (500)'
          break
        // 401 可以在这里捕获，也可以在业务错误码中捕获
        case 401:
          errorMessage = '未授权或登录状态失效 (401)'
          break
        default:
          errorMessage = `HTTP 错误: ${status}`
      }
    } else if (axios.isCancel(error)) {
      // 请求被取消
      console.log('Request canceled', error.message)
      return Promise.reject(error)
    } else if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      // 处理超时错误
      errorMessage = '请求超时，请检查网络连接。'
    } else {
      // 网络断开、无法连接到服务器等
      errorMessage = '无法连接到服务器，请检查您的网络。'
    }

    Alert.alert('请求失败', errorMessage)

    return Promise.reject(error)
  },
)

export default apiService
