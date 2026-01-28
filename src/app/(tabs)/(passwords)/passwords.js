import { StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import { FontAwesome } from '@expo/vector-icons'
import * as ScreenCapture from 'expo-screen-capture'
import Fuse from 'fuse.js'

import apiService from '@/utils/request'
import { useSession } from '@/utils/ctx'
import { decryptField, getSecureData } from '@/utils/crypto'

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
  const { filterId, filterName, filterIcon, filterColor } = useLocalSearchParams()

  const { data: checkRes } = useFetchData('/notice/check')
  useEffect(() => {
    if (checkRes) {
      useNotifyStore.getState().updateUnreadStatus(checkRes.hasUnread)
    }
  }, [])

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
  const masterKey = useAuthStore((state) => state.masterKey)
  useEffect(() => {
    const checkBiometricUnlock = async () => {
      // 如果有登录态但内存(store)里没有 masterKey，则尝试通过生物识别解锁数据
      if (session && !masterKey) {
        const secureData = await getSecureData()
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
  // 1. 在内存中解密全量数据，并使用 useMemo 避免重复解密
  const decryptedList = useMemo(() => {
    if (!data?.passwords || !masterKey) return []

    return data.passwords.map((item) => {
      try {
        return {
          ...item,
          displayTitle: decryptField(item.title, masterKey),
          displayUsername: decryptField(item.username, masterKey),
        }
      } catch (e) {
        console.error('解密失败:', e)
        return { ...item, displayTitle: '解密错误', displayUsername: '' }
      }
    })
  }, [data?.passwords, masterKey])
  // 2. 初始化 Fuse.js 实例
  const fuse = useMemo(() => {
    return new Fuse(decryptedList, {
      keys: [
        { name: 'displayTitle', weight: 0.7 }, // 标题权重更高
        { name: 'displayUsername', weight: 0.3 },
      ],
      threshold: 0.4, // 模糊匹配阈值，0.0 为精确匹配，1.0 匹配所有
      distance: 100, // 模糊匹配距离，数值越大越宽松
      ignoreLocation: true, // 不在乎模式在字符串中出现的位置
    })
  }, [decryptedList])
  // 3. 计算最终展示的过滤数据
  const filteredData = useMemo(() => {
    let list = decryptedList

    // 分类过滤
    if (activeCategory) {
      list = list.filter((item) => item.categoryId === activeCategory)
    }

    // 执行 Fuse.js 模糊搜索
    if (searchQuery.trim().length > 0) {
      const searchResults = fuse.search(searchQuery)
      list = searchResults.map((result) => result.item)
    }

    return list
  }, [searchQuery, activeCategory, decryptedList, fuse])
  // 添加密码模态框是否可见
  const [modalVisible, setModalVisible] = useState(false)

  const handleClearFilter = () => {
    setActiveCategory(null)
    router.setParams({
      filterId: undefined,
      filterName: undefined,
      filterIcon: undefined,
      filterColor: undefined,
    })
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
              filterIcon={filterIcon}
              filterColor={filterColor}
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
