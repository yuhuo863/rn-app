import { ActivityIndicator, StyleSheet, View, Text } from 'react-native'
import { useTheme } from '@/theme/useTheme'

/**
 * Loading 组件
 */
export default function Loading({ message = '加载中...' }) {
  const theme = useTheme()
  return (
    <View style={[styles.loading, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color="#1f99b0" />
      <Text style={[styles.message, { color: theme.text || '#666' }]}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999, // 确保在最上层
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 15,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
  },
})
