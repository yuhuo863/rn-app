import { useState, useEffect } from 'react'
import apiService from '@/utils/request'

const useFetchData = (url, params = {}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      const data = await apiService.get(url, { params })
      setData(data)
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const onReload = async () => {
    setLoading(true)
    setError(false)
    await fetchData()
  }

  // 当依赖参数是一个对象或引用类型，例如 params，
  // 即使它的内容没有变化，每次组件重新渲染时它的引用都会不同。
  // 从而导致 useEffect 不断触发，会造成无限循环请求。
  // 可以使用 JSON.stringify(params) 转换为字符串，来解决这个问题。
  useEffect(() => {
    fetchData()
  }, [url, JSON.stringify(params)])

  return {
    data,
    loading,
    error,
    setData,
    onReload,
  }
}

export default useFetchData
