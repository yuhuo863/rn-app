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
  DeviceEventEmitter,
  Dimensions,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import useFetchData from '@/hooks/useFetchData'
import Loading from '@/components/shared/Loading'
import NetworkError from '@/components/shared/NetworkError'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
// import useLoadMore from '@/hooks/useLoadMore'
import { FontAwesome, Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PasswordFormModal from '@/components/shared/PasswordFormModal'
import { performBiometricAuth } from '@/utils/auth'
import { authStatus } from '@/utils/auth'
import { BlurView } from 'expo-blur'
import * as ScreenCapture from 'expo-screen-capture'
import { useCategoryContext } from '@/utils/context/CategoryContext'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import apiService from '@/utils/request'

const SCREEN_WIDTH = Dimensions.get('window').width

const VISUAL_HEIGHT = 120 // 视觉上椭圆的高度（更扁平，不遮挡视线）
const TRIGGER_THRESHOLD = 160 // 逻辑上的感应区域（比视觉大，提升手感）
const DROP_ZONE_HEIGHT = 160 // 感应区高度

export default function Index() {
  const { refresh, filterId, filterName } = useLocalSearchParams()
  const { data, loading, error, refreshing, onReload, onRefresh } = useFetchData('/password')

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

  useEffect(() => {
    if (filterId) {
      setActiveCategory(filterId)
    } else {
      setActiveCategory(null)
    }
  }, [filterId])

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('app:password_updated', async () => {
      await onReload({ silent: true })
    })
    return () => sub.remove()
  }, [onReload])

  const router = useRouter()
  const handleClearFilter = () => {
    setActiveCategory(null)
    router.setParams({ filterId: undefined, filterName: undefined })
  }

  // 监听 App 状态切换（切后台自动锁定）
  useEffect(() => {
    let isCaptureProtected = false

    const setupProtection = async () => {
      // 1. 检查 API 在当前环境下是否可用
      const isAvailable = await ScreenCapture.isAvailableAsync()
      if (isAvailable) {
        // 2. 启用安全屏障，禁止截图和多任务预览(支持 iOS 和 Android)
        await ScreenCapture.preventScreenCaptureAsync()
        isCaptureProtected = true
      }
    }

    setupProtection()
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // 离开前台（进入多任务界面或锁屏）
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        authStatus.isUnlocked = false
        setIsLocked(true)
      }

      // 从后台/非活跃状态切回前台
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        setIsLocked(true)
        triggerAuth() // 自动触发身份验证
      }

      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
      // 离开页面时, 如果之前开启了保护，则恢复允许截图
      if (isCaptureProtected) {
        ScreenCapture.allowScreenCaptureAsync()
      }
    }
  }, [triggerAuth])

  const {
    state: { categories },
    isInitialized,
    refreshCategories,
  } = useCategoryContext()
  // const { onEndReached, LoadMoreFooter } = useLoadMore('/password', 'passwords', setData)
  // ---------------------------------------------------------
  // 核心重构区域：拖拽删除逻辑 (Reanimated SharedValues)
  // ---------------------------------------------------------

  // 全局共享状态：是否有人正在拖拽？(用于控制垃圾桶显示)
  // 0 = 无拖拽, 1 = 正在拖拽
  const globalIsDragging = useSharedValue(0)

  // 全局共享状态：是否进入了删除区？(用于控制垃圾桶变大变色)
  // 0 = 未进入, 1 = 已进入
  const globalIsOverZone = useSharedValue(0)

  // 最终执行删除的回调 (JS 线程)
  const handleDelete = async (id) => {
    // 触发震动反馈
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

    await apiService.delete(`/password/${id}`)
    await onReload({ silent: true })
    await refreshCategories() // 用于刷新分类列表对应分类的passwordsCount

    DeviceEventEmitter.emit('app:password:deleted')
  }

  // --- 组件：顶部回收站 (完全由 SharedValue 驱动，不触发 React Render) ---
  const RecycleBin = () => {
    // 容器动画：控制显隐和位移
    const containerStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateY: withSpring(globalIsDragging.value ? 0 : -VISUAL_HEIGHT) }],
        opacity: withTiming(globalIsDragging.value ? 1 : 0),
      }
    })

    // 图标动画：放大效果
    const iconStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: withSpring(globalIsOverZone.value ? 1.3 : 1) }],
      }
    })

    // 红色层透明度动画 (实现柔和的颜色过渡)
    // 技巧：我们不直接改变颜色，而是改变叠加在上面的红色渐变层的透明度
    const redLayerStyle = useAnimatedStyle(() => {
      return {
        opacity: withTiming(globalIsOverZone.value, { duration: 200 }),
      }
    })

    return (
      <Animated.View style={[styles.dropZoneContainer, containerStyle]}>
        {/* 1. 底层：常驻的蓝色/灰色柔和渐变 (默认状态) */}
        <View style={styles.gradientWrapper}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.9)', 'rgba(59, 130, 246, 0.05)']} // 上深下浅，极度柔和
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradientFill}
          />
        </View>

        {/* 2. 顶层：红色的警告渐变 (仅在进入区域时显现) */}
        <Animated.View style={[styles.gradientWrapper, styles.absoluteFull, redLayerStyle]}>
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.95)', 'rgba(239, 68, 68, 0.1)']} // 红色渐变
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradientFill}
          />
        </Animated.View>

        {/* 3. 图标层 (层级最高) */}
        <Animated.View style={[styles.iconWrapper, iconStyle]}>
          <FontAwesome name="trash-o" size={28} color="#fff" />
          <Text style={styles.dropText}>松手即删</Text>
        </Animated.View>
      </Animated.View>
    )
  }

  // --- 组件：可拖拽的列表项 ---
  const DraggableItem = ({ item, children }) => {
    const translateX = useSharedValue(0)
    const translateY = useSharedValue(0)
    const isPressed = useSharedValue(false)
    const context = useSharedValue({ startX: 0, startY: 0 })
    const scale = useSharedValue(1)

    const pan = Gesture.Pan()
      // 关键优化1：长按 250ms 后才激活拖拽，完美解决列表滚动冲突
      .activateAfterLongPress(200) // 缩短一点时间，提升响应速度
      .onStart(() => {
        isPressed.value = true
        globalIsDragging.value = 1 // 通知垃圾桶出现
        scale.value = withSpring(1.05)
        // 震动反馈：告诉用户“抓住了”
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium)
      })
      .onUpdate((e) => {
        translateX.value = e.translationX
        translateY.value = e.translationY

        // 只要 absoluteY < TRIGGER_THRESHOLD (160) 就触发，哪怕视觉上没碰到图标
        const isOver = e.absoluteY < TRIGGER_THRESHOLD ? 1 : 0

        if (globalIsOverZone.value !== isOver) {
          globalIsOverZone.value = isOver
          // 状态改变时给一点微弱震动反馈
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light)
        }
      })
      .onEnd((e) => {
        if (e.absoluteY < DROP_ZONE_HEIGHT) {
          // 确认删除
          runOnJS(handleDelete)(item.id)
        }
        // Reset
        translateX.value = withSpring(0)
        translateY.value = withSpring(0)
        scale.value = withSpring(1)
        globalIsDragging.value = 0
        globalIsOverZone.value = 0
        isPressed.value = false
      })
      .onFinalize(() => {
        isPressed.value = false
        globalIsDragging.value = 0 // 确保意外中断也能复位
      })

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      zIndex: isPressed.value ? 9999 : 1,
      opacity: isPressed.value ? 0.9 : 1,
    }))

    return (
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.dragWrapper, animatedStyle]}>{children}</Animated.View>
      </GestureDetector>
    )
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [filterVisible, setFilterVisible] = useState(false)
  const handleSelectCategory = (catId) => {
    setActiveCategory(catId)
    setFilterVisible(false)
  }

  const filteredData = useMemo(() => {
    if (!data?.passwords) return []

    return data.passwords
      .map((item) => {
        // 动态匹配：从全局 categories 中实时查找该密码所属的分类信息
        // 这样即便分类在另一个页面改了名，这里不需要刷新接口也会变
        const currentCategory = categories.find((c) => c.id === item.categoryId)
        return {
          ...item,
          category: currentCategory || item.category, // 优先使用全局最新数据
        }
      })
      .filter((item) => {
        const searchLower = searchQuery.toLowerCase().trim()
        const matchesSearch = searchLower === '' || item.title?.toLowerCase().includes(searchLower)
        const matchesCategory = activeCategory === null || item.categoryId === activeCategory
        return matchesSearch && matchesCategory
      })
  }, [data?.passwords, searchQuery, activeCategory, categories]) // 依赖项加入 categories

  const [modalVisible, setModalVisible] = useState(false)

  const renderItem = ({ item }) => {
    return (
      <View style={styles.cardContainer}>
        <DraggableItem item={item}>
          <TouchableOpacity
            style={styles.cardTouchable}
            activeOpacity={0.7}
            onPress={() => router.navigate(`/passwords/${item.id}`)}
            delayLongPress={5000}
          >
            <View style={styles.card}>
              {/* 卡片头部：图标与分类标签 */}
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <FontAwesome
                    name={item.category?.icon || 'lock'}
                    size={20}
                    color={item.category?.color || styles.primaryColor}
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
        </DraggableItem>
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
      {activeCategory && (
        <View style={styles.activeFilterRow}>
          <View style={styles.neuChipOuter}>
            <View style={styles.neuChipInner}>
              <FontAwesome
                name={categories?.find((c) => c.id === activeCategory)?.icon || 'tag'}
                size={14}
                color="#3b82f6"
              />
              <Text style={styles.activeFilterText}>
                {categories?.find((c) => c.id === activeCategory)?.name || '已选分类'}
              </Text>
              <TouchableOpacity onPress={handleClearFilter} style={styles.chipCloseBtn}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
            {categories?.map((cat) => (
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
                    color={activeCategory === cat.id ? '#fff' : cat.color}
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

  const renderLockedOverlayContent = () => (
    <View style={styles.lockedOverlay}>
      <View style={styles.lockCircle}>
        <Ionicons name="lock-closed" size={40} color="#3b82f6" />
      </View>
      <Text style={styles.lockTitle}>密码箱已锁定</Text>
      <Text style={styles.lockSubText}>为了您的账户安全，请验证身份</Text>

      <TouchableOpacity style={styles.retryBtn} activeOpacity={0.8} onPress={triggerAuth}>
        <Text style={styles.retryBtnText}>点击验证解锁</Text>
      </TouchableOpacity>
    </View>
  )

  const CategoryEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconOuter}>
          <View style={styles.emptyIconInner}>
            <FontAwesome name="folder-open-o" size={50} color="#cbd5e1" />
          </View>
        </View>

        <Text style={styles.emptyTitle}>
          {filterName ? `"${filterName}" 暂无记录` : '这里空空如也'}
        </Text>
        <Text style={styles.emptySubText}>
          {filterName
            ? `您尚未在 "${filterName}" 分类下存储任何资产`
            : '开始记录您的第一条加密信息吧'}
        </Text>

        <View style={styles.emptyGuideBox}>
          <Text style={styles.guideText}>点击下方蓝色按钮添加</Text>
        </View>
      </View>
    )
  }

  const renderContent = () => {
    if (loading || !isInitialized) {
      return <Loading />
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
        ListEmptyComponent={CategoryEmptyState}
        // ListFooterComponent={LoadMoreFooter}
        // onEndReached={onEndReached}
        // onEndReachedThreshold={0.1}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        scrollEnabled={true} // Gesture Handler 会自动处理冲突
      />
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
          <RecycleBin />

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

          {isLocked &&
            (Platform.OS === 'ios' ? (
              // iOS: 使用 BlurView 达到完美的毛玻璃预览效果
              <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill}>
                {renderLockedOverlayContent()}
              </BlurView>
            ) : (
              // Android: 使用实色背景遮罩。
              // 因为 Android 预览图已被 ScreenCapture 屏蔽，切回时用实色背景渲染更快，且能彻底遮挡明文。
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f8fafc' }]}>
                {renderLockedOverlayContent()}
              </View>
            ))}

          {/* 模态框：添加密码 */}
          <PasswordFormModal
            visible={modalVisible}
            mode="create"
            categoryMap={{ categories }}
            onClose={() => setModalVisible(false)}
            onSuccess={() => onReload()}
          />
          {/* 筛选分类模态框 */}
          {renderFilterModal()}
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
  dropZoneContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: VISUAL_HEIGHT, // 120
    zIndex: 999, // 确保在最上层
    justifyContent: 'flex-start',
    alignItems: 'center',
    // 移除背景色，交由内部 Gradient 处理
  },
  gradientWrapper: {
    width: SCREEN_WIDTH,
    height: VISUAL_HEIGHT,
    borderBottomLeftRadius: SCREEN_WIDTH / 1.5, // 更宽的圆弧，视觉更扁平
    borderBottomRightRadius: SCREEN_WIDTH / 1.5,
    overflow: 'hidden', // 裁剪 Gradient 为椭圆
    position: 'absolute',
    top: 0,
  },
  absoluteFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientFill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  iconWrapper: {
    marginTop: 40, // 适配刘海屏位置
    alignItems: 'center',
    justifyContent: 'center',
  },

  dropText: {
    color: 'rgba(255,255,255,0.95)',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dragWrapper: {
    flex: 1,
    // 确保拖拽层本身不限制子元素溢出
  },

  // 头部搜索与筛选
  headerWrapper: {
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#f8fafc',
  },

  activeFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 25,
    marginTop: 10,
    marginBottom: 5,
  },
  neuChipOuter: {
    backgroundColor: '#E0E5EC',
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#A3B1C6',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
      },
      android: { elevation: 4 },
    }),
  },
  neuChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#ffffff',
        shadowOffset: { width: -3, height: -3 },
        shadowOpacity: 1,
        shadowRadius: 3,
      },
    }),
  },
  activeFilterText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#444',
    marginHorizontal: 8,
  },
  chipCloseBtn: {
    marginLeft: 4,
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
    ...Platform.select({
      ios: {
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
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
  lockedOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // 配合 BlurView 增加层次感
  },
  lockCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    // 阴影让锁定图标更突出
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  lockSubText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 32,
  },
  retryBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E5EC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 2,
  },
  emptyIconInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E0E5EC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#64748b', marginTop: 24 },
  emptySubText: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
  emptyGuideBox: {
    marginTop: 40,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  guideText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
})
