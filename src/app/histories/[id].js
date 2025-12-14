import { View, Text, StyleSheet } from 'react-native'

export default function History() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>这里是密码历史记录页!</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e29447',
  },
})
