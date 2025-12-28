import { ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme } from '@/theme/useTheme'

/**
 * 加载中组件
 */
export default function Loading() {
  const theme = useTheme()
  return (
    <ActivityIndicator
      size="large"
      color="#1f99b0"
      style={[styles.loading, { backgroundColor: theme.background }]}
    />
  )
}

const styles = StyleSheet.create({
  loading: {
    backgroundColor: 'rgba(255, 255, 255, .8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
})
