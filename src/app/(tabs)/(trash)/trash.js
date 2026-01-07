import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  BackHandler,
  Animated,
  Easing,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'
import useFetchData from '@/hooks/useFetchData'
import Loading from '@/components/shared/Loading'
import NetworkError from '@/components/shared/NetworkError'
import apiService from '@/utils/request'
import { useTheme } from '@/theme/useTheme'
import useCategoryStore from '@/stores/useCategoryStore'
import useNotifyStore from '@/stores/useNotifyStore'
import CommonEmptyState from '@/components/shared/CommonEmptyState'
import useAuthStore from '@/stores/useAuthStore'
import { decryptField } from '@/utils/crypto'

const COLORS = {
  primary: '#e29447',
  background: '#F5F7FA',
  cardBg: '#FFFFFF',
  textMain: '#1A1A1A',
  textSub: '#8E8E93',
  danger: '#FF3B30',
  warning: '#FF9500',
  border: '#E5E5EA',
  selectedBg: '#FFF5EB',
}

// --- 辅助函数 ---
const getRemainingDays = (deletedAt) => {
  const deleteDate = new Date(deletedAt)
  const now = new Date()
  const diffTime = Math.abs(now - deleteDate)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const remaining = 30 - diffDays
  return remaining > 0 ? remaining : 0
}

const getHourglassIcon = (days) => {
  if (days > 20) return 'hourglass-start'
  if (days > 10) return 'hourglass-half'
  if (days > 3) return 'hourglass-end'
  return 'hourglass-o'
}

// --- 关键修复：将 SwipeableItem 移出主组件，并使用 memo 优化 ---
const SwipeableItem = memo(
  ({ item, isSelectionMode, isSelected, onRestore, onLongPress, onPress, theme, masterKey }) => {
    // 动画值引用
    const translateX = useRef(new Animated.Value(0)).current
    const opacity = useRef(new Animated.Value(1)).current
    const itemHeight = useRef(new Animated.Value(110)).current
    const marginBottom = useRef(new Animated.Value(12)).current

    // 使用 useMemo 缓存昂贵的计算，防止重渲染时卡顿
    const remaining = useMemo(() => getRemainingDays(item.deletedAt), [item.deletedAt])
    const decryptedTitle = useMemo(
      () => decryptField(item.title, masterKey),
      [item.title, masterKey],
    )

    const statusColor = useMemo(() => {
      if (remaining <= 3) return COLORS.danger
      if (remaining <= 7) return COLORS.warning
      return COLORS.textSub
    }, [remaining])

    const handleRestore = () => {
      // 组合动画：滑动 -> 消失 -> 高度塌陷
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 500,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false, // 布局属性不能用 NativeDriver
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.delay(150), // 稍微延迟高度塌陷，让滑动效果展示出来
          Animated.parallel([
            Animated.timing(itemHeight, {
              toValue: 0,
              duration: 250,
              useNativeDriver: false,
            }),
            Animated.timing(marginBottom, {
              toValue: 0,
              duration: 250,
              useNativeDriver: false,
            }),
          ]),
        ]),
      ]).start(({ finished }) => {
        if (finished) {
          // 关键：在下一帧调用父组件更新，避免动画被 React 渲染打断
          requestAnimationFrame(() => {
            onRestore(item)
          })
        }
      })
    }

    return (
      <Animated.View
        style={{
          transform: [{ translateX }],
          opacity,
          height: itemHeight,
          marginBottom: marginBottom,
          overflow: 'hidden',
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => onLongPress(item.id)}
          onPress={() => onPress(item)}
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
            isSelected && [
              styles.cardSelected,
              { backgroundColor: theme.card, borderColor: theme.border },
            ],
          ]}
        >
          <View style={styles.cardInner}>
            {/* 多选框区域 - 仅在模式开启时占据空间 */}
            {isSelectionMode && (
              <View style={styles.checkboxContainer}>
                <MaterialCommunityIcons
                  name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                  size={24}
                  color={isSelected ? COLORS.primary : '#C5C5C5'}
                />
              </View>
            )}

            <View style={styles.cardContent}>
              <View style={styles.rowTop}>
                <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
                  <FontAwesome
                    name={item.category?.icon || 'lock'}
                    size={20}
                    color={item.category?.color || '#fff'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                    {decryptedTitle || '⚠️ 数据已失效 (密钥不匹配)'}
                  </Text>
                  <Text style={[styles.categoryText, { color: theme.textSecondary }]}>
                    {item.category?.name || '未分类'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.divider || '#F0F0F0' }]} />

              <View style={styles.rowBottom}>
                <Text style={{ fontSize: 11, color: statusColor }}>
                  <FontAwesome name={getHourglassIcon(remaining)} size={12} color={statusColor} />
                  &nbsp;&nbsp;{remaining === 0 ? '即将清理' : `剩余 ${remaining} 天`}
                </Text>
                {!isSelectionMode && (
                  <TouchableOpacity
                    onPress={handleRestore}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <FontAwesome name="undo" size={20} color={theme.iconColor} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  },
  (prev, next) => {
    // 性能优化的核心：自定义比较函数
    // 只有当选中状态改变、模式改变、ID改变或主题改变时才重绘
    return (
      prev.isSelected === next.isSelected &&
      prev.isSelectionMode === next.isSelectionMode &&
      prev.item.id === next.item.id &&
      prev.theme === next.theme
    )
  },
)

export default function TrashScreen() {
  const { theme } = useTheme()
  const { masterKey } = useAuthStore.getState()
  const trashVersion = useNotifyStore((state) => state.trashVersion)
  const { data, loading, error, refreshing, onRefresh, onReload } = useFetchData('/password/trash')
  const { fetchCategories } = useCategoryStore()

  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [localDeletedIds, setLocalDeletedIds] = useState(new Set())

  // 数据过滤：使用 useMemo 确保只在源数据或删除记录变化时计算
  const filteredPasswords = useMemo(() => {
    if (!data?.passwords) return []
    return data.passwords.filter((item) => !localDeletedIds.has(item.id))
  }, [data, localDeletedIds])

  useEffect(() => {
    if (trashVersion) {
      // 当收到全局更新通知时，刷新数据并清空本地临时删除记录
      onReload({ silent: true }) // 使用静默刷新
      setLocalDeletedIds(new Set())
    }
  }, [trashVersion])

  // --- 事件处理 (全部使用 useCallback 确保引用稳定) ---

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false)
    setSelectedIds(new Set())
  }, [])

  useEffect(() => {
    const onBackPress = () => {
      if (isSelectionMode) {
        exitSelectionMode()
        return true
      }
      return false
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)
    return () => subscription.remove()
  }, [isSelectionMode, exitSelectionMode])

  const toggleSelection = useCallback((id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const onLongPressItem = useCallback(
    (id) => {
      if (!isSelectionMode) {
        setIsSelectionMode(true)
        setSelectedIds(new Set([id]))
      }
    },
    [isSelectionMode],
  )

  const onPressItem = useCallback(
    (item) => {
      if (isSelectionMode) {
        toggleSelection(item.id)
      } else {
        Alert.alert('温馨提示', '请恢复后再进行查看详情')
      }
    },
    [isSelectionMode, toggleSelection],
  )

  // 单个恢复逻辑
  const performRestore = useCallback(
    async (item) => {
      // 1. 乐观更新：立即加入本地删除列表，UI 瞬间反应
      setLocalDeletedIds((prev) => new Set(prev).add(item.id))

      try {
        await apiService.post('/password/restore', { id: item.id })

        // 2. 成功后静默刷新数据，确保数据一致性，但不触发 Loading 动画
        // 注意：这里不需要 await onReload，让它在后台跑即可，避免阻塞交互
        fetchCategories()
        useNotifyStore.getState().notifyPasswordUpdated()
        onReload({ silent: true })
      } catch (e) {
        // 3. 失败回滚：从本地删除列表中移除，Item 会重新显示出来
        setLocalDeletedIds((prev) => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
        Alert.alert('恢复失败', e.data?.errors?.[0] || '网络错误')
      }
    },
    [onReload, fetchCategories],
  )

  // 批量操作
  const handleBatchAction = (actionType) => {
    const count = selectedIds.size
    if (count === 0) return

    const isDelete = actionType === 'delete'
    const actionName = isDelete ? '彻底删除' : '恢复'

    Alert.alert(`批量${actionName}`, `确定要${actionName}选中的 ${count} 个项目吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: isDelete ? 'destructive' : 'default',
        onPress: async () => {
          const idsArray = Array.from(selectedIds)

          // 乐观更新
          setLocalDeletedIds((prev) => {
            const next = new Set(prev)
            idsArray.forEach((id) => next.add(id))
            return next
          })

          // 退出编辑模式
          exitSelectionMode()

          try {
            if (isDelete) {
              await apiService.post('/password/force', { id: idsArray })
            } else {
              await apiService.post('/password/restore', { id: idsArray })
              fetchCategories()
              useNotifyStore.getState().notifyPasswordUpdated()
            }
            // 操作完成后静默同步最新数据
            onReload({ silent: true })
          } catch (e) {
            // 简单处理：如果批量失败，刷新全量数据以恢复状态
            onReload()
            Alert.alert('操作失败', e.data?.errors?.[0] || '未知错误')
          }
        },
      },
    ])
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredPasswords.length) {
      setSelectedIds(new Set())
    } else {
      // 仅选择当前可见的（未被本地过滤的）
      const allIds = new Set(filteredPasswords.map((p) => p.id))
      setSelectedIds(allIds)
    }
  }

  // --- 渲染层 ---

  const renderItem = useCallback(
    ({ item }) => (
      <SwipeableItem
        item={item}
        isSelectionMode={isSelectionMode}
        isSelected={selectedIds.has(item.id)}
        onRestore={performRestore}
        onLongPress={onLongPressItem}
        onPress={onPressItem}
        theme={theme}
        masterKey={masterKey}
      />
    ),
    [isSelectionMode, selectedIds, performRestore, onLongPressItem, onPressItem, theme, masterKey],
  )

  const renderHeader = () => {
    if (isSelectionMode) {
      return (
        <View
          style={[
            styles.headerContainer,
            styles.selectionHeader,
            { backgroundColor: theme.background },
          ]}
        >
          <TouchableOpacity onPress={exitSelectionMode} hitSlop={10}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.selectionTitle}>已选择 {selectedIds.size} 项</Text>
          <TouchableOpacity onPress={handleSelectAll} hitSlop={10}>
            <Text style={styles.selectAllText}>
              {selectedIds.size > 0 && selectedIds.size === filteredPasswords.length
                ? '全不选'
                : '全选'}
            </Text>
          </TouchableOpacity>
        </View>
      )
    }
    return (
      <View style={[styles.headerContainer, { backgroundColor: theme.background }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>回收站</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {data?.total || 0} 个项目 · {data?.daysLeft || 30} 天后自动清除
          </Text>
        </View>
      </View>
    )
  }

  // 避免 Loading 时完全销毁列表结构，只在无数据且 Loading 时显示 Loading
  if (loading) return <Loading />
  if (error) return <NetworkError />

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        {renderHeader()}

        <FlatList
          data={filteredPasswords}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={!loading && <CommonEmptyState />}
          // 这里的 extraData 确保当 Set 发生变化时，FlatList 知道需要重新检查 renderItem
          extraData={[selectedIds, isSelectionMode]} // 确保每次渲染时都带上最新的选中状态
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              enabled={!isSelectionMode}
              tintColor={COLORS.primary}
            />
          }
          initialNumToRender={10} // 初始渲染的条目数，减少初次加载的开销
          maxToRenderPerBatch={10} // 每次渲染的条目数，减少渲染开销
          windowSize={10} // 渲染窗口大小，减少内存占用
          removeClippedSubviews={Platform.OS === 'android'} // 安卓上移除屏幕外的子视图，减少内存占用
        />

        {isSelectionMode && (
          <View
            style={[
              styles.bottomBar,
              { backgroundColor: theme.card || '#fff', borderTopColor: theme.border },
            ]}
          >
            <TouchableOpacity
              style={[styles.bottomBtn, styles.bottomBtnSecondary]}
              onPress={() => handleBatchAction('delete')}
              disabled={selectedIds.size === 0}
            >
              <Text style={[styles.bottomBtnText, { color: COLORS.danger }]}>彻底删除</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bottomBtn,
                styles.bottomBtnPrimary,
                { opacity: selectedIds.size === 0 ? 0.6 : 1 },
              ]}
              onPress={() => handleBatchAction('restore')}
              disabled={selectedIds.size === 0}
            >
              <Text style={styles.bottomBtnTextWhite}>恢复 ({selectedIds.size})</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
    height: 80, // 固定高度防止 Header 切换时跳动
    justifyContent: 'center',
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 4 },
  selectionTitle: { fontSize: 17, fontWeight: '600', color: COLORS.textSub },
  cancelText: { fontSize: 16, color: COLORS.textSub },
  selectAllText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  card: {
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'visible', // 允许阴影溢出卡片
  },
  cardSelected: {
    backgroundColor: COLORS.selectedBg,
    borderColor: COLORS.primary,
  },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  checkboxContainer: { marginRight: 12 },
  cardContent: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemTitle: { fontSize: 15, fontWeight: '600' },
  categoryText: { fontSize: 11 },
  divider: { height: 1, marginVertical: 6 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 10,
  },
  bottomBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBtnSecondary: { backgroundColor: '#F2F2F7', marginRight: 12 },
  bottomBtnPrimary: { backgroundColor: COLORS.primary },
  bottomBtnText: { fontSize: 15, fontWeight: '600' },
  bottomBtnTextWhite: { fontSize: 15, fontWeight: '600', color: '#fff' },
})
