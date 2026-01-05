import { create } from 'zustand'

const useNotifyStore = create((set) => ({
  // 触发个人中心刷新的版本号
  profileVersion: 0,
  // 触发密码列表刷新的版本号
  passwordVersion: 0,
  // 触发回收站列表刷新的版本号
  trashVersion: 0,
  // 通知红点状态: 标识是否有未读消息
  hasUnread: false,

  // 更新红点状态（供首页调用）
  updateUnreadStatus: (status) => set({ hasUnread: status }),

  // 清除红点（供通知中心页面调用）
  clearUnread: () => set({ hasUnread: false }),

  // 通知个人信息已更新
  notifyProfileUpdated: () =>
    set((state) => ({
      profileVersion: state.profileVersion + 1,
    })),

  // 通知密码列表已更新
  notifyPasswordUpdated: () =>
    set((state) => ({
      passwordVersion: state.passwordVersion + 1,
    })),

  // 通知回收站列表已更新
  notifyTrashUpdated: () =>
    set((state) => ({
      trashVersion: state.trashVersion + 1,
    })),

  // 重置所有通知信号
  reset: () =>
    set({
      profileVersion: 0,
      passwordVersion: 0,
      trashVersion: 0,
      hasUnread: false,
    }),
}))

export default useNotifyStore
