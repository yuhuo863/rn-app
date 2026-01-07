import { useState, useEffect, useCallback } from 'react'
import apiService from '@/utils/request'

const useFetchData = (url, params = {}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // 使用 useCallback 保证函数引用稳定
  const fetchData = useCallback(
    async (isSilent = false) => {
      // 关键修复：只有在非静默且当前无数据时，才展示 Loading
      // 这避免了有数据时刷新导致的闪烁
      if (!isSilent && !data) {
        setLoading(true)
      }
      setError(false)

      try {
        const response = await apiService.get(url, { params })
        setData(response) // 直接替换数据，React 会进行 Diff 更新，不会白屏
      } catch (err) {
        setError(true)
      } finally {
        setLoading(false)
      }
    },
    [url, JSON.stringify(params), data],
  )

  const onReload = async (props = {}) => {
    // 关键修复：完全静默，不触碰 loading 状态
    const isSilent = props.silent || false
    await fetchData(isSilent)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData(true) // 刷新视为静默获取（因为有下拉指示器）
    setRefreshing(false)
  }

  useEffect(() => {
    fetchData()
  }, [url, JSON.stringify(params)])

  return {
    data,
    loading,
    error,
    refreshing,
    setData,
    onReload,
    onRefresh,
  }
}

export default useFetchData
