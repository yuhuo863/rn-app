import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/theme/useTheme'
import useFetchData from '@/hooks/useFetchData'
import NetworkError from '@/components/shared/NetworkError'
import { useEffect } from 'react'
import { router } from 'expo-router'
import useNotifyStore from '@/stores/useNotifyStore'
import CommonEmptyState from '@/components/shared/CommonEmptyState'
import useLoadMore from '@/hooks/useLoadMore'
import { formatActionTime } from '@/utils/time'

// 2. 图标配置映射 (根据 type)
const getNoticeConfig = (type, theme) => {
  switch (type) {
    case 2: // 版本更新
      return {
        icon: 'rocket-outline',
        bgColor: theme.primary,
        iconColor: theme.primaryLight, // Indigo
      }
    case 1: // 系统公告 (默认)
    default:
      return {
        icon: 'notifications-outline', // 或者 megaphone-outline
        bgColor: theme.primary,
        iconColor: theme.primaryLight, // Slate-500
      }
  }
}

export default function NotificationList() {
  const { theme } = useTheme()
  const {
    data: noticesData,
    setData,
    loading,
    refreshing,
    onRefresh,
    error,
    onReload,
  } = useFetchData('/notice')
  const { onEndReached, resetLoadMore, LoadMoreFooter } = useLoadMore('/notice', 'notices', setData)
  useEffect(() => {
    useNotifyStore.getState().clearUnread()
  }, [])

  /**
   * 下拉刷新，并重置加载更多状态
   */
  const handleRefresh = async () => {
    await onRefresh()
    resetLoadMore()
  }

  const renderItem = ({ item }) => {
    const config = getNoticeConfig(item.type, theme)

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card }]}
        onPress={() => router.navigate(`/notices/${item.id}`)}
      >
        {/* 左侧图标 */}
        <View style={[styles.iconBox, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.icon} size={22} color={config.iconColor} />
        </View>

        {/* 右侧内容 */}
        <View style={styles.content}>
          <View style={styles.cardHeader}>
            <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.timeText, { color: theme.textTertiary }]}>
              {formatActionTime(item.createdAt)}
            </Text>
          </View>
          <Text style={[styles.itemContent, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.content.replace(/\\n/g, '\n')}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    )
  }

  if (error) {
    return <NetworkError onReload={onReload} />
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={noticesData.notices}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listPadding}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.textTertiary}
          />
        }
        ListEmptyComponent={<CommonEmptyState />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={LoadMoreFooter}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  listPadding: { padding: 20 },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
    // 阴影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemTitle: { fontSize: 16, fontWeight: '700', width: '72%' },
  timeText: { fontSize: 12 },
  itemContent: { fontSize: 14 },
})
