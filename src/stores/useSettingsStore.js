import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

const useSettingsStore = create(
  persist(
    (set) => ({
      clipboardTimeout: 0, // 默认 0 秒，即不自动清除
      setClipboardTimeout: (value) => set({ clipboardTimeout: value }),
    }),
    {
      name: 'settings-storage', // 存储在 AsyncStorage 中的 key
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)

export default useSettingsStore
