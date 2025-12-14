import { View, Text, StyleSheet } from 'react-native'
import { Link } from 'expo-router'

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>这里是密码列表页</Text>

      <Link style={styles.link} href="/passwords/2?title=Google">
        查看 ID 为 2 的密码详情
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
