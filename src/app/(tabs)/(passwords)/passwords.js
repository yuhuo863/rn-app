import {
  Text,
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  ScrollView,
  Alert,
  AppState,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import useFetchData from '@/hooks/useFetchData'
import Loading from '@/components/shared/Loading'
import NetworkError from '@/components/shared/NetworkError'
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router'
import EmptyState from '@/components/shared/EmptyState'
// import useLoadMore from '@/hooks/useLoadMore'
import { FontAwesome, Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PasswordFormModal from '@/components/shared/PasswordFormModal'
import { performBiometricAuth } from '@/utils/auth'
import { authStatus } from '@/utils/auth'

export default function Index() {
  const { refresh } = useLocalSearchParams()
  const { data, loading, error, refreshing, onReload, onRefresh } = useFetchData('/password', {
    paranoid: 'true',
  })

  const [isLocked, setIsLocked] = useState(!authStatus.isUnlocked) // 初始状态为锁定
  const appState = useRef(AppState.currentState)
  const triggerAuth = useCallback(async () => {
    if (authStatus.isUnlocked) {
      setIsLocked(false)
      if (refresh) onReload()
      return
    }
    // 增加一点延时，确保系统 UI 已经准备好唤起 FaceID/指纹
    // await new Promise((resolve) => setTimeout(resolve, 200))

    try {
      const success = await performBiometricAuth()
      if (success) {
        authStatus.isUnlocked = true
        setIsLocked(false)
        if (refresh) onReload()
      } else {
        console.log('识别被取消或失败')
        setIsLocked(true)
      }
    } catch (e) {
      Alert.alert('身份校验', '验证过程出错，请重试', [
        { text: '点击重试', onPress: () => triggerAuth() },
      ])
    }
  }, [refresh])

  // 处理页面聚焦（首次进入或 Back 返回）
  useFocusEffect(
    useCallback(() => {
      triggerAuth()
    }, [triggerAuth]),
  )

  // 监听 App 状态切换（切后台自动锁定）
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // 从后台/非活跃状态切回前台
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        authStatus.isUnlocked = false
        setIsLocked(true)
        triggerAuth() // 自动触发身份验证
      }

      // 离开前台（进入多任务界面或锁屏）
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        authStatus.isUnlocked = false
        setIsLocked(true)
      }

      appState.current = nextAppState
    })

    return () => subscription.remove()
  }, [triggerAuth])

  const { data: categoryMap, loading: cLoading, error: cError } = useFetchData('/category')
  // const { onEndReached, LoadMoreFooter } = useLoadMore('/password', 'passwords', setData)

  // 搜索与分类筛选状态
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(null) // null 表示“全部”
  const [filterVisible, setFilterVisible] = useState(false) // 控制筛选弹出层显示
  const handleSelectCategory = (catId) => {
    setActiveCategory(catId)
    setFilterVisible(false)
  }
  // 使用 useMemo 计算最终显示的列表（叠加逻辑）
  const filteredData = useMemo(() => {
    if (!data?.passwords) return []

    return data.passwords.filter((item) => {
      // 搜索过滤：匹配标题或用户名
      const searchLower = searchQuery.toLowerCase().trim()
      const matchesSearch =
        searchLower === '' ||
        item.title?.toLowerCase().includes(searchLower) ||
        item.username?.toLowerCase().includes(searchLower)

      // 分类过滤：匹配选中 ID
      const matchesCategory = activeCategory === null || item.categoryId === activeCategory

      // 只有同时满足搜索和分类条件的才显示
      return matchesSearch && matchesCategory
    })
  }, [data?.passwords, searchQuery, activeCategory])

  const [modalVisible, setModalVisible] = useState(false)

  const renderItem = ({ item }) => {
    return (
      <View style={styles.cardContainer}>
        <Link href={`/passwords/${item.id}`} asChild>
          <TouchableOpacity style={styles.cardTouchable} activeOpacity={0.7}>
            <View style={styles.card}>
              {/* 卡片头部：图标与分类标签 */}
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <FontAwesome
                    name={item.category?.icon || 'lock'}
                    size={20}
                    color={styles.primaryColor}
                  />
                </View>
                {item.category?.name && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText} numberOfLines={1}>
                      {item.category.name}
                    </Text>
                  </View>
                )}
              </View>

              {/* 卡片标题区 */}
              <View style={styles.titleSection}>
                <Text style={styles.title} numberOfLines={1}>
                  {item?.title}
                </Text>
              </View>

              {/* 分割线 */}
              <View style={styles.divider} />

              {/* 卡片底部：信息区（图标化） */}
              <View style={styles.cardFooter}>
                <View style={styles.infoRow}>
                  <FontAwesome name="user" size={12} color="#94a3b8" style={styles.infoIcon} />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {item?.username || '未设置'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome name="key" size={12} color="#94a3b8" style={styles.infoIcon} />
                  {/* 密码脱敏显示，提升隐私感 */}
                  <Text style={styles.passwordMask} numberOfLines={1}>
                    •••••••••
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Link>
      </View>
    )
  }

  const renderSearchBar = () => (
    <View style={styles.headerWrapper}>
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={16} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索标题或用户名..."
          placeholderTextColor="#94a3b8"
          onChangeText={setSearchQuery}
          submitBehavior="blurAndSubmit"
        />
        <TouchableOpacity
          style={[styles.filterBtn, activeCategory && styles.filterBtnActive]}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="filter" size={24} color={activeCategory ? '#fff' : '#64748b'} />
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderFilterModal = () => (
    <Modal
      visible={filterVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setFilterVisible(false)}
    >
      {/* 点击半透明背景关闭 */}
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setFilterVisible(false)}
      >
        {/* 阻止点击弹窗内容时触发背景的关闭事件 */}
        <TouchableOpacity activeOpacity={1} style={styles.bottomSheet}>
          {/* 弹窗顶部固定栏：标题与重置 */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>全部分类</Text>
            <TouchableOpacity
              onPress={() => {
                setActiveCategory(null)
                setFilterVisible(false)
              }}
            >
              <Text style={styles.resetText}>重置</Text>
            </TouchableOpacity>
          </View>

          {/* --- 核心滚动区域 --- */}
          <ScrollView
            showsVerticalScrollIndicator={true} // 显示滚动条，提示用户可滑动
            style={styles.categoryScrollArea}
            contentContainerStyle={styles.categoryGrid} // 网格布局放在 contentContainer 里
          >
            {categoryMap?.categories?.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  activeCategory === cat.id && styles.categoryItemActive,
                ]}
                onPress={() => handleSelectCategory(cat.id)}
              >
                <View
                  style={[
                    styles.categoryIconBox,
                    activeCategory === cat.id && styles.categoryIconBoxActive,
                  ]}
                >
                  <FontAwesome
                    name={cat.icon || 'folder'}
                    size={20}
                    color={activeCategory === cat.id ? '#fff' : '#64748b'}
                  />
                </View>
                <Text
                  style={[
                    styles.categoryName,
                    activeCategory === cat.id && styles.categoryNameActive,
                  ]}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* --- 核心滚动区域结束 --- */}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )

  const renderContent = () => {
    if (loading) {
      return <Loading />
    }

    if (isLocked) {
      return (
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={60} color="#3b82f6" />
          <Text style={styles.lockText}>密码箱已锁定</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={triggerAuth}>
            <Text style={styles.retryBtnText}>点击验证解锁</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (error) {
      return <NetworkError onReload={onReload} />
    }

    return (
      <FlatList
        data={filteredData}
        keyboardShouldPersistTaps="handled" // 确保在搜索时点击列表不会让键盘无故消失
        removeClippedSubviews={Platform.OS === 'android'} // Android 优化
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        horizontal={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={styles.primaryColor}
          />
        }
        ListEmptyComponent={EmptyState}
        // ListFooterComponent={LoadMoreFooter}
        // onEndReached={onEndReached}
        // onEndReachedThreshold={0.1}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
      />
    )
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {renderSearchBar()}
        {renderContent()}

        {/* 悬浮添加按钮 */}
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
        >
          <FontAwesome name="plus" size={24} color="#fff" />
        </TouchableOpacity>

        {/* 模态框：添加密码 */}
        <PasswordFormModal
          visible={modalVisible}
          mode="create"
          categoryMap={categoryMap}
          onClose={() => setModalVisible(false)}
          onSuccess={() => onReload()}
        />
        {/* 筛选分类模态框 */}
        {renderFilterModal()}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  // 全局颜色与变量
  primaryColor: '#3b82f6',
  backgroundColor: '#f8fafc',

  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // 头部搜索与筛选
  headerWrapper: {
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginBottom: 8,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  filterBtn: {
    width: 46,
    height: 46,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  // 遮罩层：全屏半透明黑
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', // 将内容推到底部
  },

  // 半屏弹窗主体
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20, // 适配 iOS 底部小横条
    maxHeight: '50%', // 关键：限制最大高度为屏幕的 50%，超过则内部滚动
  },

  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  resetText: {
    color: '#3b82f6',
    fontWeight: '600',
  },

  // 滚动区域
  categoryScrollArea: {
    width: '100%',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap', // 允许换行形成网格
    justifyContent: 'flex-start',
    paddingBottom: 20,
  },

  // 单个分类选项样式（适配多列）
  categoryItem: {
    width: '25%', // 每行显示 4 个
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconBoxActive: {
    backgroundColor: '#3b82f6',
  },
  categoryName: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#1e293b',
    fontWeight: 'bold',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1e293b' },

  // 列表容器样式
  listContent: {
    paddingHorizontal: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12, // 启用 gap 需要较新版本 RN，如不支持请用 marginRight 处理
  },

  // 卡片容器
  cardContainer: {
    flex: 1,
    marginBottom: 12,
    maxWidth: '48%', // 强制双列宽度限制
  },
  cardTouchable: {
    borderRadius: 16,
    backgroundColor: '#fff',
    // 阴影优化
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  card: {
    padding: 16,
    minHeight: 150, // 移除固定高度，使用最小高度
    flexDirection: 'column',
  },

  // 卡片内部布局
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '50%',
  },
  categoryBadgeText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },

  titleSection: {
    flex: 1,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  urlText: {
    fontSize: 11,
    color: '#94a3b8',
  },

  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 10,
  },

  cardFooter: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 16,
    textAlign: 'center',
    marginRight: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  passwordMask: {
    fontSize: 12,
    color: '#3b82f6', // 蓝色圆点更显眼
    fontWeight: 'bold',
    letterSpacing: 1,
    flex: 1,
    marginTop: 2,
  },

  // 悬浮按钮
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    // 强烈的悬浮阴影
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  // 模态框样式
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  formContainer: {
    padding: 24,
  },

  // 输入框组样式
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    height: 54,
    paddingHorizontal: 12,
  },
  iconBox: {
    width: 32,
    alignItems: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    height: '100%',
  },
  picker: {
    flex: 1,
    height: 50, // Android Picker height
  },

  // 模态框按钮
  modalButtons: {
    padding: 24,
    paddingTop: 0,
    marginTop: 'auto', // 推到底部
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  lockedContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockText: {
    fontSize: 18,
    color: '#1e293b',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
})
