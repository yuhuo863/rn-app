import { StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import { FontAwesome } from '@expo/vector-icons'
import * as ScreenCapture from 'expo-screen-capture'

import apiService from '@/utils/request'
import { useSession } from '@/utils/ctx'
import { getSecureDataWithBiometrics } from '@/utils/crypto'

import RecycleBin from '@/components/passwords/RecycleBin'
import PasswordGrid from '@/components/passwords/PasswordGrid'
import SearchAndFilterHeader from '@/components/passwords/SearchAndFilterHeader'
import CategoryFilterModal from '@/components/passwords/CategoryFilterModal'
import PasswordFormModal from '@/components/passwords/PasswordFormModal'
import Loading from '@/components/shared/Loading'
import NetworkError from '@/components/shared/NetworkError'

import useFetchData from '@/hooks/useFetchData'
import { useTheme } from '@/theme/useTheme'
import useCategoryStore from '@/stores/useCategoryStore'
import useAuthStore from '@/stores/useAuthStore'
import useNotifyStore from '@/stores/useNotifyStore'

export default function Index() {
  const router = useRouter()
  const { theme } = useTheme()
  const { filterId, filterName } = useLocalSearchParams()

  const { data: checkRes } = useFetchData('/notice/check')
  useEffect(() => {
    if (checkRes) {
      useNotifyStore.getState().updateUnreadStatus(checkRes.hasUnread)
    }
  }, [checkRes])

  const passwordVersion = useNotifyStore((state) => state.passwordVersion)
  const { data, loading, error, refreshing, onReload, onRefresh } = useFetchData('/password')
  const { categories, isLoading, fetchCategories } = useCategoryStore()

  useEffect(() => {
    if (passwordVersion) {
      onReload()
    }
  }, [passwordVersion])

  // 初始化筛选条件
  useEffect(() => {
    if (filterId) {
      setActiveCategory(filterId)
    } else {
      setActiveCategory(null)
    }
  }, [filterId])

  // 初始化分类数据
  useEffect(() => {
    if (!isLoading) {
      fetchCategories()
    }
  }, [])

  const { session } = useSession()
  const { masterKey } = useAuthStore.getState()
  useEffect(() => {
    const checkBiometricUnlock = async () => {
      // 如果有登录态但内存里没有 Key，尝试识别
      if (session && !masterKey) {
        const secureData = await getSecureDataWithBiometrics()
        if (secureData) {
          useAuthStore.getState().setMasterKey(secureData.masterKey)
          useAuthStore.getState().setSystemPepper(secureData.systemPepper)
          // 此时页面会自动重新渲染，解密函数就能正常工作了
        } else {
          // 如果用户取消识别或识别失败，建议引导回登录页或保持锁定状态
          Alert.alert('提示', '请重新登录以解锁数据', [
            {
              text: '重新登录',
              onPress: () => router.replace('/auth/sign-out'),
            },
            { text: '取消', style: 'cancel' },
          ])
        }
      }
    }

    void checkBiometricUnlock()
  }, [session, masterKey])

  // 阻止截图
  useEffect(() => {
    let isCaptureProtected = false

    const setupProtection = async () => {
      if (await ScreenCapture.isAvailableAsync()) {
        await ScreenCapture.preventScreenCaptureAsync()
        isCaptureProtected = true
      }
    }
    setupProtection()

    return () => {
      if (isCaptureProtected) {
        ScreenCapture.allowScreenCaptureAsync()
      }
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
    useNotifyStore.getState().notifyTrashUpdated()
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

  const handleClearFilter = () => {
    setActiveCategory(null)
    router.setParams({ filterId: undefined, filterName: undefined })
  }
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
