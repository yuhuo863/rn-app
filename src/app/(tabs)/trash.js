import { View, Text, StyleSheet } from 'react-native'

export default function TrashScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={styles.title}>Trash Screen</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 48,
    fontWeight: 'bold',
  },
})
