import { StyleSheet, TouchableOpacity, Platform, Alert, AppState } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import * as ScreenCapture from 'expo-screen-capture'
import * as SecureStore from 'expo-secure-store'
import { FontAwesome } from '@expo/vector-icons'

import apiService from '@/utils/request'
import { authStatus } from '@/utils/auth'
import { performBiometricAuth } from '@/utils/auth'
import { useNotifications } from '@/utils/context/NotificationContext'

import RecycleBin from '@/components/passwords/RecycleBin'
import LockedOverlay from '@/components/passwords/LockedOverlay'
import PasswordGrid from '@/components/passwords/PasswordGrid'
import SearchAndFilterHeader from '@/components/passwords/SearchAndFilterHeader'
import CategoryFilterModal from '@/components/passwords/CategoryFilterModal'
import PasswordFormModal from '@/components/passwords/PasswordFormModal'
import Loading from '@/components/shared/Loading'
import NetworkError from '@/components/shared/NetworkError'

import useFetchData from '@/hooks/useFetchData'
import { useTheme } from '@/theme/useTheme'
import useCategoryStore from '@/stores/categories'

export default function Index() {
  const { theme } = useTheme()
  const { updateUnreadStatus } = useNotifications()
  const { data: checkRes } = useFetchData('/notice/check')
  useEffect(() => {
    if (checkRes) {
      updateUnreadStatus(checkRes.hasUnread)
    }
  }, [checkRes])

  const { refresh, filterId, filterName } = useLocalSearchParams()
  const router = useRouter()
  const { data, loading, error, refreshing, onReload, onRefresh } = useFetchData('/password')

  const [isLocked, setIsLocked] = useState(!authStatus.isUnlocked) // 初始状态为锁定
  const appState = useRef(AppState.currentState)
  const triggerAuth = useCallback(async () => {
    if (authStatus.isUnlocked) {
      setIsLocked(false)
      if (refresh) onReload()
      return
    }

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
  useFocusEffect(
    useCallback(() => {
      async function checkReload() {
        const needsRefresh = await SecureStore.getItemAsync('passwordListNeedsRefresh')
        if (needsRefresh) {
          await onReload({ silent: true })
          await SecureStore.deleteItemAsync('passwordListNeedsRefresh')
        }
      }
      void checkReload()
    }, []),
  )

  useEffect(() => {
    if (filterId) {
      setActiveCategory(filterId)
    } else {
      setActiveCategory(null)
    }
  }, [filterId])

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

  const { categories, isLoading, fetchCategories } = useCategoryStore()
  useEffect(() => {
    if (!isLoading) {
      fetchCategories()
    }
  }, [])

  // 全局共享状态：是否正在拖拽？(用于控制垃圾桶显示)
  // 0 = 无拖拽, 1 = 正在拖拽
  const globalIsDragging = useSharedValue(0)

  // 全局共享状态：是否进入了删除区？(用于控制垃圾桶变大变色)
  // 0 = 未进入, 1 = 已进入
  const globalIsOverZone = useSharedValue(0)

  // 最终执行删除的回调 (JS 线程)
  const handleDelete = async (id) => {
    await apiService.delete(`/password/${id}`)
    await onReload({ silent: true })
    await fetchCategories() // 用于刷新分类列表对应分类的passwordsCount
    // 标记回收站页面需要刷新
    await SecureStore.setItemAsync('recycleBinNeedsRefresh', 'true')
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [filterVisible, setFilterVisible] = useState(false)
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

  // 添加密码模态框是否可见
  const [modalVisible, setModalVisible] = useState(false)

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView
          style={[styles.container, { backgroundColor: theme.background }]}
          edges={['left', 'right']}
        >
          {/* 垃圾桶删除区 */}
          <RecycleBin globalIsDragging={globalIsDragging} globalIsOverZone={globalIsOverZone} />

          {/* 搜索输入框 */}
          <SearchAndFilterHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeCategory={activeCategory}
            categories={categories}
            onClearFilter={handleClearFilter}
            onOpenFilter={() => setFilterVisible(true)}
          />

          {/* 可拖拽的密码列表 */}
          {loading || isLoading ? (
            <Loading />
          ) : error ? (
            <NetworkError onReload={onReload} />
          ) : (
            <PasswordGrid
              data={filteredData}
              refreshing={refreshing}
              onRefresh={onRefresh}
              onDelete={handleDelete}
              filterName={filterName}
              globalIsDragging={globalIsDragging}
              globalIsOverZone={globalIsOverZone}
            />
          )}

          {/* 添加按钮 */}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.background }]}
            activeOpacity={0.8}
            onPress={() => setModalVisible(true)}
          >
            <FontAwesome name="plus" size={24} color={theme.primary} />
          </TouchableOpacity>

          {/* 锁定遮罩 */}
          <LockedOverlay isLocked={isLocked} onUnlock={triggerAuth} />

          {/* 模态框：添加密码 */}
          <PasswordFormModal
            visible={modalVisible}
            mode="create"
            categoryMap={{ categories }}
            onClose={() => setModalVisible(false)}
            onSuccess={() => onReload()}
          />

          {/* 分类筛选模态框 */}
          <CategoryFilterModal
            visible={filterVisible}
            categories={categories}
            activeCategory={activeCategory}
            onSelect={(id) => {
              setActiveCategory(id)
              setFilterVisible(false)
            }}
            onReset={() => {
              setActiveCategory(null)
              setFilterVisible(false)
            }}
            onClose={() => setFilterVisible(false)}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    ...Platform.select({
      ios: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
})
