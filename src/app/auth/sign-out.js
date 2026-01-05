import { useEffect } from 'react'
import { useRouter } from 'expo-router'

import { useSession } from '@/utils/ctx'
import useCategoryStore from '@/stores/useCategoryStore'
import useAuthStore from '@/stores/useAuthStore'
import Loading from '@/components/shared/Loading'
import * as SecureStore from 'expo-secure-store'
import useNotifyStore from '@/stores/useNotifyStore'

export default function SignOut() {
  const { signOut } = useSession()
  const router = useRouter()

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut()
      await SecureStore.deleteItemAsync('user_master_key_secure_storage')
      useCategoryStore.getState().reset()
      useAuthStore.getState().reset()
      useNotifyStore.getState().reset()
      router.navigate('/users')
    }

    void handleSignOut()
  }, [])

  return <Loading />
}
