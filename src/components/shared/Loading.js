import { ActivityIndicator, StyleSheet, View, Text } from 'react-native'
import { useTheme } from '@/theme/useTheme'

/**
 * Loading 组件
 */
export default function Loading({ message = '加载中...' }) {
  const { theme } = useTheme()
  return (
    <View style={[styles.loading, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color="#1f99b0" />
      <Text style={[styles.loadingText, { color: theme.text || '#666' }]}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999, // 确保在最上层
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
})
