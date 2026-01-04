import { create } from 'zustand'

/**
 * 专门用于管理内存加密密钥的 Store
 * masterKey 不进行持久化，仅在 App 运行期间存在于内存中
 */
const useAuthStore = create((set, get) => ({
  masterKey: null, // 存储派生出的 Buffer 格式密钥

  // 设置密钥
  setMasterKey: (key) => set({ masterKey: key }),

  // 清除密钥（退出登录时调用）
  reset: () => set({ masterKey: null }),
}))

export default useAuthStore
