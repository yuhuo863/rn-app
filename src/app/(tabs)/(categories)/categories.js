import { View, Text, StyleSheet } from 'react-native'

export default function Categories() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>这里是分类页面</Text>
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
    fontSize: 40,
    fontWeight: 'bold',
    color: '#e29447',
  },
})
