import axios from 'axios'
import { Alert } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'

const apiService = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
})

const TOKEN_KEY = 'session'

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
    // 这里只处理 2xx 成功响应
    return response.data.data
  },
  async (error) => {
    // 这里处理所有非 2xx 响应
    const { response } = error

    // 检查是否有响应对象且状态码为 401
    if (response && response.status === 401) {
      // 增加一个状态锁，防止多个请求同时 401 弹出多个 Alert
      if (!global.isShowingAuthAlert) {
        global.isShowingAuthAlert = true
        Alert.alert('登录过期', '您的身份信息已失效，请重新登录', [
          {
            text: '去登录',
            onPress: () => {
              global.isShowingAuthAlert = false
              router.replace('/auth/sign-out')
            },
          },
        ])
      }
      // 返回一个永远 Pending 的 Promise 是合理的
      // 因为此时页面即将跳转，没必要让业务层再去处理“已被丢弃”的请求结果，防止页面继续处理错误数据
      return new Promise(() => {})
    }

    // 处理其他类型的错误（如网络问题或服务器报错）
    return Promise.reject(error.response || error)
  },
)

export default apiService
