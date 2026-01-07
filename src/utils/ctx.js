import { use, createContext } from 'react'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native'

import { useStorageState } from '@/hooks/useStorageState'
import apiService from '@/utils/request'
import { deriveMasterKey, saveSecureData } from '@/utils/crypto'
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
  // 初始化会话信息
  const initializeSession = async (data, password) => {
    const { token, user, system_pepper } = data

    // 1. 派生主密钥
    // 登录成功后，立即在本地利用原始密码派生主密钥
    // 使用 userId 作为盐值，确保密钥的唯一性和确定性
    const mKey = await deriveMasterKey(password, user.id, system_pepper)

    // 2. 存入安全存储 (SecureStore)
    // 生成功后，静默存入安全隔层
    await saveSecureData(mKey, system_pepper)

    // 3. 更新内存 Store
    useAuthStore.getState().setMasterKey(mKey)
    useAuthStore.getState().setSystemPepper(system_pepper)
    useAuthStore.getState().setUser(user)

    // 4. 持久化 Session Token
    await setSession(token)
  }
  return (
    <AuthContext.Provider
      value={{
        signUp: async (formParams, setLoading) => {
          try {
            const data = await apiService.post('/auth/register', formParams)
            await initializeSession(data, formParams.password)
            Alert.alert('提示', '您已经注册成功！', [
              {
                text: 'OK',
                onPress: () => {
                  setLoading(false)
                  router.navigate('/passwords')
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
            await initializeSession(data, formParams.password)
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
