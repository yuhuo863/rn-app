import { Text, View, StyleSheet, ScrollView } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import useFetchData from '@/hooks/useFetchData'
import { useTheme } from '@/theme/useTheme'
import Loading from '@/components/shared/Loading'
import NetworkError from '@/components/shared/NetworkError'

export default function NotificationDetails() {
  const { theme } = useTheme()
  const { id } = useLocalSearchParams()
  const { data, loading, error, onReload } = useFetchData(`/notice/${id}`)
  const notice = data?.notice

  if (loading) {
    return <Loading />
  }
  if (error) {
    return <NetworkError onReload={onReload} />
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.noticeBackground }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* 标题区域 */}
        <Text style={styles.title}>{notice?.title}</Text>

        {/* 元数据区域 (时间) */}
        <Text style={styles.metaTime}>{notice?.createdAt}</Text>

        {/* 分割线 */}
        <View style={styles.divider} />

        {/* 正文区域 */}
        <Text style={styles.bodyText}>{notice?.content.replace(/\\n/g, '\n')}</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24, // 保持充足的边距，增加呼吸感
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF', // 纯白标题
    marginBottom: 8,
    lineHeight: 32,
  },
  metaTime: {
    fontSize: 14,
    color: '#828282', // 灰色辅助文字
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#2C3038', // 深灰分割线
    marginBottom: 24,
  },
  bodyText: {
    fontSize: 16,
    color: '#E0E0E0', // 次白正文，比标题稍暗，减少视觉疲劳
    lineHeight: 26,
    letterSpacing: 0.5,
  },
})
