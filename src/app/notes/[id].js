import { View, Text, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

export default function Note() {
  const { details } = useLocalSearchParams()
  return (
    <View style={styles.container}>
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
