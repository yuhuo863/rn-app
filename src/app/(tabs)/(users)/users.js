import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useSession } from '@/utils/ctx'
import apiService from '@/utils/request'
import useFetchData from '@/hooks/useFetchData'

export default function Index() {
  const { signOut } = useSession()
  const { data: user } = useFetchData('user/me')
  // if (user) {
  //   console.log('user=>', user)
  // }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>这里是用户页</Text>
      <Text style={styles.text}>用户名：{user?.username}</Text>
      <Text style={styles.text}>邮箱：{user?.email}</Text>
      <Text style={styles.text}>性别：{user?.sex === 1 ? '男' : '女'}</Text>

      <TouchableOpacity onPress={signOut}>
        <Text style={styles.button}>安全退出</Text>
      </TouchableOpacity>
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
  button: {
    marginTop: 20,
    fontSize: 20,
    color: '#1f99b0',
  },
})
