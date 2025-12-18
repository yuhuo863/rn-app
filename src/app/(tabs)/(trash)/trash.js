import React, { useState, useEffect } from 'react'
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
  LayoutAnimation,
  UIManager,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'
import useFetchData from '@/hooks/useFetchData'
import Loading from '@/components/shared/Loading'
import NetworkError from '@/components/shared/NetworkError'
import apiService from '@/utils/request'

// Android 开启 LayoutAnimation
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !global?.nativeFabricUIManager // 如果检测到 Fabric (新架构)，则跳过此行
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

const COLORS = {
  primary: '#e29447',
  background: '#F5F7FA',
  cardBg: '#FFFFFF',
  textMain: '#1A1A1A',
  textSub: '#8E8E93',
  danger: '#FF3B30',
  warning: '#FF9500',
  border: '#E5E5EA',
  selectedBg: '#FFF5EB', // 选中时的背景色
}

export default function TrashScreen() {
  const { data, loading, error, refreshing, onRefresh, onReload } = useFetchData('/password/trash')

  // --- 多选模式状态 ---
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())

  // 退出多选模式时重置
  const exitSelectionMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setIsSelectionMode(false)
    setSelectedIds(new Set())
  }

  useEffect(() => {
    const onBackPress = () => {
      if (isSelectionMode) {
        exitSelectionMode() // 调用退出多选逻辑
        return true // 阻止默认行为（即不退出 APP/页面）
      }
      return false // 执行默认行为
    }
    // 监听屏幕边缘的“右滑/左滑”操作
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

    return () => subscription.remove()
  }, [isSelectionMode])

  // 切换选中状态
  const toggleSelection = (id) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
      if (newSet.size === 0 && isSelectionMode) {
        // 可选：如果取消了所有选择，是否自动退出模式？通常保留模式更好
        // exitSelectionMode()
      }
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  // 长按触发
  const onLongPressItem = (id) => {
    if (!isSelectionMode) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setIsSelectionMode(true)
      const newSet = new Set()
      newSet.add(id)
      setSelectedIds(newSet)
    }
  }

  // 点击处理
  const onPressItem = (item) => {
    if (isSelectionMode) {
      toggleSelection(item.id)
    } else {
      // 非多选模式下的点击逻辑（例如查看详情或提示）
      Alert.alert('温馨提示', '请恢复后再进行查看详情')
    }
  }

  // 批量操作处理
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
          try {
            const idsArray = Array.from(selectedIds)
            if (isDelete) {
              await apiService.post('/password/force', { id: idsArray })
            } else {
              await apiService.post('/password/restore', { id: idsArray })
            }
            await onReload()
            exitSelectionMode()
          } catch (e) {
            Alert.alert('操作失败', e.data.errors[0])
          }
        },
      },
    ])
  }

  // 全选/反选逻辑 (可选)
  const handleSelectAll = () => {
    if (selectedIds.size === data?.passwords?.length) {
      setSelectedIds(new Set()) // 全不选
    } else {
      const allIds = new Set(data?.passwords?.map((p) => p.id))
      setSelectedIds(allIds)
    }
  }

  // 计算剩余天数
  const getRemainingDays = (deletedAt) => {
    const deleteDate = new Date(deletedAt)
    const now = new Date()

    // 计算已经过去的天数
    const diffTime = Math.abs(now - deleteDate)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    const totalLimit = 30 // 30天自动清理
    const remaining = totalLimit - diffDays

    return remaining > 0 ? remaining : 0
  }
  const getHourglassIcon = (days) => {
    if (days > 20) return 'hourglass-start' // 满沙
    if (days > 10) return 'hourglass-half' // 半沙
    if (days > 3) return 'hourglass-end' // 少量
    return 'hourglass-o' // 几乎空了
  }

  // --- 渲染组件 ---

  const renderHeader = () => {
    if (!data) return null

    // 多选模式下的 Header
    if (isSelectionMode) {
      return (
        <View style={[styles.headerContainer, styles.selectionHeader]}>
          <TouchableOpacity onPress={exitSelectionMode}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.selectionTitle}>已选择 {selectedIds.size} 项</Text>
          <TouchableOpacity onPress={handleSelectAll}>
            <Text style={styles.selectAllText}>
              {selectedIds.size === data?.passwords?.length ? '全不选' : '全选'}
            </Text>
          </TouchableOpacity>
        </View>
      )
    }

    // 正常模式 Header
    return (
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>回收站</Text>
          <Text style={styles.headerSubtitle}>
            {data.total || 0} 个项目 · {data.daysLeft || 30} 天后自动清除
          </Text>
        </View>
      </View>
    )
  }

  const renderItem = ({ item }) => {
    const isSelected = selectedIds.has(item.id)
    const remaining = getRemainingDays(item.deletedAt)

    let statusColor = COLORS.textSub
    if (remaining <= 3) statusColor = COLORS.danger
    else if (remaining <= 7) statusColor = COLORS.warning

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => onLongPressItem(item.id)}
        onPress={() => onPressItem(item)}
        style={[
          styles.card,
          isSelected && styles.cardSelected, // 选中时的样式变化
        ]}
      >
        <View style={styles.cardInner}>
          {/* 多选模式下的复选框 */}
          {isSelectionMode && (
            <View style={styles.checkboxContainer}>
              <MaterialCommunityIcons
                name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                size={24}
                color={isSelected ? COLORS.primary : '#C5C5C5'}
              />
            </View>
          )}

          {/* 原有内容区 */}
          <View style={styles.cardContent}>
            <View style={styles.rowTop}>
              <View style={styles.iconBox}>
                <FontAwesome
                  name={item.category?.icon || 'lock'}
                  size={20}
                  color={COLORS.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.categoryText}>{item.category?.name || '未分类'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.rowBottom}>
              <Text
                style={{
                  fontSize: 11,
                  color: statusColor,
                }}
              >
                <FontAwesome name={getHourglassIcon(remaining)} size={12} color={statusColor} />
                &nbsp;&nbsp;{remaining === 0 ? '即将清理' : `剩余 ${remaining} 天`}
              </Text>
              {!isSelectionMode && (
                // 非多选模式下显示单独恢复按钮
                <TouchableOpacity
                  onPress={() => {
                    /* 单独恢复逻辑 */
                    console.log('111')
                  }}
                  hitSlop={10}
                >
                  <FontAwesome name="undo" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderContent = () => {
    if (loading) return <Loading />
    if (error) return <NetworkError />

    return (
      <FlatList
        data={data?.passwords || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        extraData={selectedIds} // 关键！确保 Set 变化时列表重绘
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            enabled={!isSelectionMode}
            tintColor={COLORS.primary}
          />
        }
      />
    )
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}

        {renderContent()}
        {/* 底部操作栏 (仅多选模式显示) */}
        {isSelectionMode && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.bottomBtn, styles.bottomBtnSecondary]}
              onPress={() => handleBatchAction('delete')}
              disabled={selectedIds.size === 0}
            >
              <Text style={[styles.bottomBtnText, { color: COLORS.danger }]}>彻底删除</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bottomBtn, styles.bottomBtnPrimary]}
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
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 }, // 底部留出空间给 Action Bar

  // Header
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.textMain },
  headerSubtitle: { fontSize: 12, color: COLORS.textSub, marginTop: 4 },
  selectionTitle: { fontSize: 17, fontWeight: '600' },
  cancelText: { fontSize: 16, color: COLORS.textSub },
  selectAllText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },

  // Card
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden', // 配合选中态
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardSelected: {
    backgroundColor: COLORS.selectedBg,
    borderColor: COLORS.primary,
  },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: 12 },

  // Checkbox Area
  checkboxContainer: { marginRight: 12 },

  // Content
  cardContent: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFF0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textMain },
  categoryText: { fontSize: 11, color: COLORS.textSub },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 6 },

  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Bottom Action Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34, // 适配 iPhone 底部黑条
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
  bottomBtnSecondary: { backgroundColor: '#FFF0F0', marginRight: 12 },
  bottomBtnPrimary: { backgroundColor: COLORS.primary },
  bottomBtnText: { fontSize: 15, fontWeight: '600' },
  bottomBtnTextWhite: { fontSize: 15, fontWeight: '600', color: '#fff' },
})
