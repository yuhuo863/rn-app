import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import useFetchData from '@/hooks/useFetchData'
import { Image } from 'expo-image'
import { useEffect, useState } from 'react'
import { getCachedAvatarUri } from '@/utils/avatarCache'

export default function Index() {
  const { data: user, loading: isLoading } = useFetchData('user/me')

  const [avatarUri, setAvatarUri] = useState(undefined)

  // 用户数据加载完成后处理头像缓存
  useEffect(() => {
    if (user?.id && user?.avatar) {
      getCachedAvatarUri(user.id, user.avatar).then((uri) => {
        setAvatarUri(uri)
      })
    } else {
      setAvatarUri(undefined)
    }
  }, [user])

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>个人中心</Text>

      {/* 头像 */}
      <View style={styles.avatarContainer}>
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[styles.avatar, styles.placeholderAvatar]}>
            <Text style={styles.placeholderText}>暂无头像</Text>
          </View>
        )}
      </View>

      <Text style={styles.text}>用户名：{user?.username || '未设置'}</Text>
      <Text style={styles.text}>邮箱：{user?.email || '未设置'}</Text>
      <Text style={styles.text}>
        性别：{user?.sex === 1 ? '男' : user?.sex === 0 ? '女' : '未设置'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e29447',
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  placeholderAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ddd',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  text: {
    fontSize: 18,
    marginVertical: 8,
    color: '#333',
  },
})
