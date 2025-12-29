import { ScrollView, StyleSheet, Linking, Platform, Alert } from 'react-native'
import { TableView } from 'clwy-react-native-tableview-simple'
import { Cell, Section } from '@/components/settings/TableView'
import { useTheme } from '@/theme/useTheme'
import Constants from 'expo-constants'
import * as Updates from 'expo-updates'

export default function About() {
  const { theme } = useTheme()

  const appVersion = Constants.expoConfig.version // 如 "1.0.0"

  const openUrl = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      } else {
        Alert.alert('无法打开链接', `无法处理此 URL: ${url}`)
      }
    } catch (error) {
      Alert.alert('错误', '无法打开该 URL')
    }
  }

  const checkForUpdates = async () => {
    // 在 Expo Go 或纯开发模式下禁用更新检查
    if (Constants.appOwnership === 'expo' || __DEV__) {
      Alert.alert(
        '开发模式提示',
        '更新检查功能仅在独立构建的 App 中可用。\n\n请使用 EAS Build 构建后测试。',
        [{ text: '知道了' }],
      )
      return
    }
    try {
      const update = await Updates.checkForUpdateAsync()

      if (update.isAvailable) {
        Alert.alert('发现新版本', '有可用的更新，立即下载并重启应用？', [
          { text: '取消', style: 'cancel' },
          {
            text: '更新',
            onPress: async () => {
              await Updates.fetchUpdateAsync()
              Alert.alert('更新下载完成', '应用即将重启以应用更新', [
                { text: '立即重启', onPress: () => Updates.reloadAsync() },
              ])
            },
          },
        ])
      } else {
        Alert.alert('已是最新版本', `当前版本：${appVersion}`)
      }
    } catch (error) {
      Alert.alert('检查失败', '无法连接到更新服务器，请检查网络后重试')
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <TableView>
        <Section header="应用信息">
          <Cell accessory={false} title="应用名称" detail="KeyVault" cellStyle="RightDetail" />
          <Cell accessory={false} title="当前版本" detail={appVersion} cellStyle="RightDetail" />
          <Cell title="检查更新" accessory="DisclosureIndicator" onPress={checkForUpdates} />
        </Section>

        <Section header="开发者">
          <Cell
            title="联系邮箱"
            accessory="DisclosureIndicator"
            onPress={() => {
              const email = 'support@yuhuo863.top'
              const subject = 'KeyVault 反馈'
              const mailtoUrl =
                Platform.OS === 'ios'
                  ? `mailto:${email}?subject=${subject}`
                  : `mailto:${email}?subject=${encodeURIComponent(subject)}`
              openUrl(mailtoUrl)
            }}
          />
          <Cell
            title="GitHub"
            accessory="DisclosureIndicator"
            onPress={() => openUrl('https://github.com/yuhuo863/rn-app')}
          />
        </Section>
      </TableView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
})
