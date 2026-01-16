import * as Clipboard from 'expo-clipboard'
import useSettingsStore from '@/stores/useSettingsStore'
import Toast from 'react-native-root-toast'
import { Alert } from 'react-native'

let clipboardTimer = null

export const copyToClipboard = async (text, label, theme) => {
  // 从持久化存储中获取设置
  const { clipboardTimeout } = useSettingsStore.getState()

  if (clipboardTimer) clearTimeout(clipboardTimer)

  if (clipboardTimeout > 0) {
    clipboardTimer = setTimeout(async () => {
      // 检查剪贴板内容是否与当前文本相同，如果是则清除剪贴板
      const current = await Clipboard.getStringAsync()
      if (current === text) {
        await Clipboard.setStringAsync('')
        Toast.show('已清除剪贴板', {
          duration: Toast.durations.SHORT,
          position: Toast.positions.CENTER,
          backgroundColor: theme?.card || '#ffffff',
          textColor: theme?.text || '#000000',
          containerStyle: { borderRadius: 20, paddingHorizontal: 20 },
        })
      }
    }, clipboardTimeout * 1000)
  }

  if (!text) return
  try {
    await Clipboard.setStringAsync(text)
    Toast.show(`${label}已复制`, {
      duration: Toast.durations.SHORT,
      position: Toast.positions.CENTER,
      backgroundColor: theme?.card || '#ffffff',
      textColor: theme?.text || '#000000',
      containerStyle: { borderRadius: 20, paddingHorizontal: 20 },
    })
  } catch (error) {
    Alert.alert('错误', '复制失败，请重试')
  }
}
