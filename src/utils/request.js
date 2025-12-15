import axios from 'axios'
import { Alert } from 'react-native'
import * as SecureStore from 'expo-secure-store'

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
    return response.data.data
  },
  (error) => {
    return Promise.reject(error.response)
  },
)

export default apiService
