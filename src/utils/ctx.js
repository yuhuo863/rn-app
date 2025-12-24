import { use, createContext } from 'react'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native'

import { useStorageState } from '@/hooks/useStorageState'
import apiService from '@/utils/request'

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
            const data = await apiService.post('/auth/login', formParams)
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
