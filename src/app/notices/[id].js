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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.title, { color: theme.text }]}>{notice?.title}</Text>

        <Text style={[styles.metaTime, { color: theme.textTertiary }]}>{notice?.createdAt}</Text>

        <View style={[styles.divider, { backgroundColor: theme.textSecondary }]} />

        <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
          {notice?.content.replace(/\\n/g, '\n')}
        </Text>
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
