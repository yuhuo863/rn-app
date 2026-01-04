import { use, createContext } from 'react'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native'

import { useStorageState } from '@/hooks/useStorageState'
import apiService from '@/utils/request'
import { deriveMasterKey } from '@/utils/crypto'
import useAuthStore from '@/stores/useAuthStore'

const AuthContext = createContext({
  signIn: () => null,
  signUp: () => null,
  signOut: () => null,
  destroyAccount: () => null,
  session: null,
  isLoading: false,
})

// 使用这个钩子来获取用户信息
export function useSession() {
  const value = use(AuthContext)
  if (!value) {
    throw new Error('useSession 必须包裹在 <SessionProvider /> 里')
  }

  return value
}

export function SessionProvider({ children }) {
  const router = useRouter()
  const [[isLoading, session], setSession] = useStorageState('session')

  return (
    <AuthContext.Provider
      value={{
        signUp: async (formParams, setLoading) => {
          try {
            const data = await apiService.post('/auth/register', formParams)
            await setSession(data.token)
            Alert.alert('提示', '您已经注册成功。', [
              {
                text: 'OK',
                onPress: () => {
                  setLoading(false)
                  router.navigate('/users')
                },
              },
            ])
          } catch (err) {
            Alert.alert('错误', err.data.errors[0], [
              {
                text: 'OK',
                onPress: () => setLoading(false),
              },
            ])
          }
        },
        signIn: async (formParams, setLoading) => {
          try {
            // 1. 调用后端登录接口 (发送明文密码进行 bcrypt 校验)
            const data = await apiService.post('/auth/login', formParams)
            // 2. 登录成功后，立即在本地利用原始密码派生主密钥
            // 使用 login(username/email) 作为盐值，确保密钥的唯一性和确定性
            const mKey = deriveMasterKey(formParams.password, formParams.login)
            // 3. 将派生出的密钥存入内存 Store，供后续加解密使用
            useAuthStore.getState().setMasterKey(mKey)
            await setSession(data.token)
            setLoading(false)
            router.navigate('/passwords')
          } catch (err) {
            Alert.alert(
              '错误',
              err.data.errors[0],
              [
                {
                  text: 'OK',
                  onPress: () => setLoading(false),
                },
              ],
              { cancelable: false },
            )
          }
        },
        signOut: async () => {
          await setSession(null)
          useAuthStore.getState().reset() // 退出时务必清空内存密钥
        },
        destroyAccount: async () => {
          await apiService.delete('/user/me')
          await setSession(null)
        },
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
