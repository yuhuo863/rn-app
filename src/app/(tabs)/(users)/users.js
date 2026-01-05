import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import useFetchData from '@/hooks/useFetchData'
import { Image } from 'expo-image'
import { useEffect } from 'react'
import Loading from '@/components/shared/Loading'
import NetworkError from '@/components/shared/NetworkError'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '@/theme/useTheme'
import useNotifyStore from '@/stores/useNotifyStore'

export default function Index() {
  const { theme } = useTheme()
  const router = useRouter()
  // 1. 从 Store 获取 profileVersion
  const profileVersion = useNotifyStore((state) => state.profileVersion)
  const { data: user, error, loading, onReload } = useFetchData('user/me')

  useEffect(() => {
    if (profileVersion > 0) {
      onReload()
    }
  }, [profileVersion])

  // 处理点击更新信息按钮
  const handleEditProfile = () => {
    router.push({
      pathname: '/profiles/edit',
      params: {
        username: user.username,
        email: user.email,
        sex: user.sex,
        avatar: user.avatar,
      },
    })
  }

  const renderContent = () => {
    if (loading) return <Loading />
    if (error) return <NetworkError onReload={onReload} />
    return (
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 顶部背景装饰 */}
        <View style={[styles.headerBanner, { backgroundColor: theme.headerBanner }]} />

        {/* 用户基础信息卡片 */}
        <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
          <View style={[styles.avatarWrapper, { backgroundColor: theme.avatarBackground }]}>
            {user?.avatar ? (
              <Image
                source={{ uri: user?.avatar }}
                cachePolicy="memory-disk" // 缓存策略: 优先查内存，再查磁盘，最后才下载
                style={styles.avatar}
                contentFit="cover"
                transition={300}
              />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}>
                <Ionicons name="person" size={50} color="#ccc" />
              </View>
            )}
          </View>
          <Text style={[styles.username, { color: theme.text }]}>{user?.username || '未设置'}</Text>
          <Text style={[styles.userId, { color: theme.textSecondary }]} numberOfLines={1}>
            ID: {user?.id || '---'}
          </Text>
        </View>

        {/* 详细资料列表 */}
        <View style={[styles.infoSection, { backgroundColor: theme.card }]}>
          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <View style={styles.infoLabelSide}>
              <Ionicons name="mail-outline" size={20} color={theme.iconColor} />
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>邮箱</Text>
            </View>
            <Text style={[styles.infoValue, { color: theme.text }]}>{user?.email || '未设置'}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.infoLabelSide}>
              <Ionicons name="transgender-outline" size={20} color={theme.iconColor} />
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>性别</Text>
            </View>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {user?.sex === 1 ? '男' : user?.sex === 0 ? '女' : '保密'}
            </Text>
          </View>
        </View>

        {/* 更新信息操作按钮 */}
        <TouchableOpacity
          style={[styles.updateButton, { backgroundColor: theme.buttonColor }]}
          onPress={handleEditProfile}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.updateButtonText}>更新个人信息</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>{renderContent()}</View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    paddingBottom: 40,
  },
  headerBanner: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 160,
    backgroundColor: '#e29447',
  },
  profileCard: {
    marginTop: 80,
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    // 阴影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarWrapper: {
    marginTop: -70, // 让头像浮起来
    padding: 5,
    backgroundColor: '#fff',
    borderRadius: 65,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  userId: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  infoSection: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginTop: 20,
    paddingVertical: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  infoLabelSide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  updateButton: {
    flexDirection: 'row',
    backgroundColor: '#e29447',
    width: '90%',
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    // 阴影
    shadowColor: '#e29447',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
})
