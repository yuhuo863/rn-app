import { useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import apiService from '@/utils/request'

export default function useLoadMore(url, key, setData) {
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const onEndReached = async () => {
    if (loading) return
    if (!hasMore) return

    setLoading(true)
    const nextPage = page + 1
    setPage(nextPage)
    try {
      const data = await apiService.get(url, {
        params: {
          page: nextPage,
        },
      })
      if (data[key].length === 0) {
        setHasMore(false)
      } else {
        setData((prevData) => ({
          [key]: [...prevData[key], ...data[key]],
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const LoadMoreFooter = () => {
    let message
    if (loading) {
      message = '加载中...'
    } else if (!hasMore) {
      message = '没有更多了'
    } else {
      message = '上拉加载更多'
    }

    return (
      <View style={styles.container}>
        {loading && <ActivityIndicator size="small" color="#1f99b0" />}
        <Text style={styles.message}>{message}</Text>
      </View>
    )
  }

  const resetLoadMore = () => {
    setHasMore(true)
    setPage(1)
  }

  return {
    onEndReached,
    resetLoadMore,
    LoadMoreFooter,
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  message: {
    fontSize: 13,
    marginHorizontal: 16,
  },
})
