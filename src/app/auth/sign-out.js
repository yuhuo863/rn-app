import { useEffect } from 'react'
import { useRouter } from 'expo-router'

import { useSession } from '@/utils/ctx'
import useCategoryStore from '@/stores/useCategoryStore'
import Loading from '@/components/shared/Loading'

export default function SignOut() {
  const { signOut } = useSession()
  const router = useRouter()

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut()
      useCategoryStore.getState().reset()
      router.navigate('/users')
    }

    void handleSignOut()
  }, [])

  return <Loading />
}
