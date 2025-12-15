import { View, Text, StyleSheet } from 'react-native'

export default function TrashScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={styles.title}>这是回收站页面</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#e29447',
  },
})
