import React, { createContext, useContext, useState } from 'react'

const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {
  const [hasUnread, setHasUnread] = useState(false)

  // 提供一个方法给首页接口调用，设置红点状态
  const updateUnreadStatus = (status) => {
    console.log('旧状态:', hasUnread, '新状态:', status)
    setHasUnread(status)
  }

  // 提供一个方法给通知页调用，消除红点
  const clearUnread = () => setHasUnread(false)

  return (
    <NotificationContext.Provider value={{ hasUnread, updateUnreadStatus, clearUnread }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
