import { useEffect, useCallback, useReducer } from 'react'
import * as SecureStore from 'expo-secure-store'

// useReducer 初始化状态：[isLoading, value]
// [true, null] 表示数据正在从 SecureStore 中异步加载。
function useAsyncState(initialValue = [true, null]) {
  // reducer 逻辑：一旦 action 触发，即认为加载完成，将 isLoading 标记设为 false。
  return useReducer((state, action) => [false, action], initialValue)
}

export async function setStorageItemAsync(key, value) {
  if (value == null) {
    await SecureStore.deleteItemAsync(key)
  } else {
    await SecureStore.setItemAsync(key, value)
  }
}

export function useStorageState(key) {
  // 状态初始化：[isLoading=true, value=null]。
  // setState 实际上是 useReducer 的 dispatch，负责将 isLoading 标记从 true 切换到 false。
  const [state, setState] = useAsyncState()

  // 1. 数据读取 (同步到内存)：
  useEffect(() => {
    SecureStore.getItemAsync(key).then((value) => {
      // 读取完成后，调用 setState(value) 触发状态更新为 [false, value]。
      setState(value)
      // 此时状态有两种情况:
      // 1. [false, null]： 状态告诉系统：“数据目前是 null，这是最终结果 (false)，存储中确实没有这个值。”
      // 2. [false, value]： 状态告诉系统：“数据已经成功获取 (false)，这是存储中的值 (value)。”
    })
  }, [key])

  // 2. 数据写入 (双向同步)：
  const setValue = useCallback(
    async (value) => {
      // 持久化：首先，将新值异步写入安全存储 (SecureStore)。
      await setStorageItemAsync(key, value)
      // 内存同步：然后，更新组件的内存状态，立即反映新值。
      setState(value)
    },
    [key],
  )

  return [state, setValue]
}
