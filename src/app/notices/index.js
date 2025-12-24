import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/theme/useTheme'
import useFetchData from '@/hooks/useFetchData'
import NetworkError from '@/components/shared/NetworkError'
import { useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { useNotifications } from '@/utils/context/NotificationContext'

// 1. 时间格式化工具函数
const formatTime = (dateString) => {
  const now = new Date()
  const date = new Date(dateString)
  const diff = (now - date) / 1000 // 秒数差

  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`

  const days = Math.floor(diff / 86400)
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`

  // 超过7天，显示具体日期 YYYY-MM-DD
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

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
  const { data: noticesData, loading, error, onReload } = useFetchData('/notice')
  const { clearUnread } = useNotifications()
  useEffect(() => {
    clearUnread()
  }, [])

  const renderItem = ({ item }) => {
    const config = getNoticeConfig(item.type, theme)

    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]}>
        {/* 左侧图标 */}
        <View style={[styles.iconBox, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.icon} size={22} color={config.iconColor} />
        </View>

        {/* 右侧内容 */}
        <View style={styles.content}>
          <View style={styles.cardHeader}>
            <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.timeText, { color: theme.textTertiary }]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
          <Text style={[styles.itemContent, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.content}
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
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 50 }}>
            暂无通知
          </Text>
        }
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
    alignItems: 'flex-start', // 改为顶部对齐，防止多行内容导致图标位置奇怪
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
  content: { flex: 1, paddingTop: 2 }, // 微调文字垂直位置与图标对齐
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // 确保标题和时间水平对齐
    marginBottom: 6,
  },
  itemTitle: { fontSize: 16, fontWeight: '700' },
  timeText: { fontSize: 12 },
  itemContent: { fontSize: 14, lineHeight: 20 },
})
