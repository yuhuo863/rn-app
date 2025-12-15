import { View, Text, StyleSheet } from 'react-native'
import { Link } from 'expo-router'

export default function Categories() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>这里是分类页面</Text>

      <Link style={styles.link} href="/histories/1">
        打开密码历史记录页（Modal 弹出）
      </Link>
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
  link: {
    marginTop: 20,
    fontSize: 20,
    color: '#1f99b0',
  },
})
