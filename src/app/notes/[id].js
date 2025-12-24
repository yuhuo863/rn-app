import { View, Text, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useTheme } from '@/theme/useTheme'

export default function Note() {
  const { theme } = useTheme()
  const { details } = useLocalSearchParams()
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={styles.detail}>{details}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
  },
  detail: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#69d',
  },
})
