import { Alert, Platform, ScrollView, Share, StyleSheet } from 'react-native'
import { TableView } from 'clwy-react-native-tableview-simple'
import { Cell, Section } from '@/components/settings/TableView'
import { useTheme } from '@/theme/useTheme'
import { useEffect, useState } from 'react'
import ThemeActionSheet from '@/components/settings/ThemeActionSheet'
import { useRouter } from 'expo-router'
import { useSession } from '@/utils/ctx'
import { calculateAppCacheSize, clearAppCache } from '@/utils/cache'

export default function Index() {
  const { destroyAccount } = useSession()
  const router = useRouter()
  const { theme, themeMode } = useTheme()
  const [cacheSize, setCacheSize] = useState('0 MB')
  /**
   * 弹出外观设置选择器
   */
  const [isSheetVisible, setSheetVisible] = useState(false)

  // 显示当前外观模式
  const getModeLabel = (mode) => {
    const labels = { system: '跟随系统', light: '浅色', dark: '深色' }
    return labels[mode] || '跟随系统'
  }
  // 初始化计算缓存大小
  useEffect(() => {
    const loadCacheSize = async () => {
      const size = await calculateAppCacheSize()
      setCacheSize(size)
    }
    loadCacheSize()
  }, [])

  // 分享应用
  const onShare = async () => {
    const url = 'https://www.yuhuo863.top'
    const message = Platform.OS === 'ios' ? 'KeyVault' : `KeyVault：\n${url}`

    await Share.share({
      title: 'KeyVault',
      message, // iOS、Android 都支持
      url, // 只有 iOS 支持
    })
  }

  // 清理缓存
  const handleClearCache = async () => {
    try {
      await clearAppCache()
      const size = await calculateAppCacheSize()
      setCacheSize(size)
      Alert.alert('清理成功', '缓存已清除')
    } catch (e) {
      Alert.alert('清理失败', '请稍后重试')
    }
  }
  // 注销账户
  const handleDestroyAccount = async () => {
    try {
      await destroyAccount()
      Alert.alert('提示', '您的账户已注销。', [
        {
          text: 'OK',
          onPress: () => {
            router.navigate('/users')
          },
        },
      ])
    } catch (e) {
      Alert.alert('错误', '账户注销失败，请稍后重试。')
    }
  }
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <TableView>
        <Section>
          <Cell title="关于 App" onPress={() => router.push('/settings/about')} />
          <Cell title="修改密码" onPress={() => router.push('/settings/change-password')} />
          <Cell title="密码生成器" onPress={() => router.push('/settings/generator')} />
        </Section>

        <Section>
          <Cell
            title="外观设置"
            detail={getModeLabel(themeMode)}
            cellStyle="RightDetail"
            detailTextStyle={{ color: theme.textSecondary, fontSize: 14 }}
            onPress={() => setSheetVisible(true)}
          />
          <Cell title="反馈建议" onPress={() => router.push('/settings/feedback')} />
          <Cell title="分享好友" onPress={onShare} />
          <Cell
            title="注销账户"
            onPress={() => {
              Alert.alert('重要警告', '注销后将无法再次登录，确定要注销吗？', [
                { text: '取消', style: 'cancel' },
                {
                  text: '继续',
                  onPress: () => {
                    Alert.alert('真的注销吗？', '如操作失误，请在7日内联系管理员恢复。', [
                      { text: '取消', style: 'cancel' },
                      { text: '确认注销', onPress: handleDestroyAccount, style: 'destructive' },
                    ])
                  },
                  style: 'destructive',
                },
              ])
            }}
          />
          <Cell
            title="清理缓存"
            detail={cacheSize}
            cellStyle="RightDetail"
            onPress={handleClearCache}
          />
        </Section>

        <Section>
          <Cell
            title="安全退出"
            titleTextColor="#ff9d9d"
            onPress={() => {
              router.navigate('/auth/sign-out')
            }}
          />
        </Section>
      </TableView>

      <ThemeActionSheet visible={isSheetVisible} onClose={() => setSheetVisible(false)} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    backgroundColor: '#f2f2f2',
  },
})
