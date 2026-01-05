import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      masterKey: null, // 存储在内存中, SecureStorage 持久化
      system_pepper: null, // 存储在内存中 SecureStorage 持久化

      setUser: (user) => set({ user }),
      setMasterKey: (masterKey) => set({ masterKey }),
      setSystemPepper: (system_pepper) => set({ system_pepper }),

      reset: () => set({ user: null, masterKey: null, system_pepper: null, profileVersion: 0 }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // 指定哪些字段需要 AsyncStorage 持久化
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
)

export default useAuthStore
