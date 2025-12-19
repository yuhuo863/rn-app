import { useState, useMemo } from 'react'
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  TextInput,
  Alert,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome, Ionicons } from '@expo/vector-icons'
import Loading from '@/components/shared/Loading'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import apiService from '@/utils/request'
import { useCategoryContext } from '@/utils/context/CategoryContext'
import { showConfirm } from '@/components/shared/CustomConfirm'
import Toast from 'react-native-root-toast'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

export default function Categories() {
  const {
    state: { categories: cats },
    dispatch,
    ACTION_TYPES,
    isInitialized,
    refreshCategories,
  } = useCategoryContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [actionVisible, setActionVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)

  const categories = useMemo(() => {
    if (!cats) return []
    return cats.filter((cat) => cat.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()))
  }, [cats, searchQuery])

  const router = useRouter()
  const handleCategoryPress = (item) => {
    router.push({
      pathname: '/passwords',
      params: {
        filterId: item.id,
        filterName: item.name,
      },
    })
  }

  const categorySearchBar = () => (
    <View style={styles.searchWrapper}>
      <View style={styles.neuSearchInput}>
        <Ionicons name="search" size={18} color="#94a3b8" />
        <TextInput
          style={styles.input}
          placeholder="搜索分类"
          placeholderTextColor="#94a3b8"
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  )

  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState({ name: '', icon: '', color: '' })
  // 处理点击底部蓝色 "+" 按钮 (新增模式)
  const handleAddClick = () => {
    setEditingCategory({ name: '', icon: 'hashtag', color: '#3b82f6' }) // 初始化为空数据
    setEditModalVisible(true)
  }
  // 处理长按菜单中的“编辑”点击
  const handleEditClick = (item) => {
    setLongPressActiveId(null) // 关闭高亮样式
    setEditingCategory(item) // 将当前点击的分类数据存入编辑状态
    setEditModalVisible(true) // 开启模态框
  }

  const [submitting, setSubmitting] = useState(false)
  const handleFormSubmit = async () => {
    if (!editingCategory.name.trim()) {
      Alert.alert('提示', '请输入分类名称')
      return
    }
    if (submitting) return
    setSubmitting(true)
    try {
      const isEdit = !!editingCategory.id
      const url = isEdit ? `category/${editingCategory.id}` : 'category/'
      const method = isEdit ? 'put' : 'post'

      const resultData = await apiService[method](url, {
        name: editingCategory.name.trim(),
        icon: editingCategory.icon,
        color: editingCategory.color,
      })

      if (isEdit) {
        dispatch({ type: ACTION_TYPES.UPDATE_CATEGORY, payload: resultData.category })
      } else {
        dispatch({ type: ACTION_TYPES.ADD_CATEGORY, payload: resultData.newCategory })
      }

      setEditModalVisible(false)

      await refreshCategories()
      setEditingCategory({ name: '', icon: 'folder', color: '#3b82f6' })
    } catch (error) {
      console.error('error=>', error)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('错误', '分类操作失败，请稍后再试')
    } finally {
      setSubmitting(false)
    }
  }
  const CategoryFormModal = () => {
    const iconOptions = [
      'folder',
      'id-card',
      'globe',
      'credit-card',
      'shopping-cart',
      'gamepad',
      'users',
      'envelope',
    ]
    const colorOptions = [
      '#3b82f6', // 经典蓝
      '#10b981', // 翡翠绿
      '#f59e0b', // 琥珀橙
      '#ef4444', // 胭脂红
      '#8b5cf6', // 丁香紫
      '#06b6d4', // 青金蓝
      '#64748b', // 蓝灰色
    ]
    const isEditMode = !!editingCategory?.id

    return (
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Pressable style={styles.halfModalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalFixedHeader}>
                <View style={styles.modalIndicator} />

                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{isEditMode ? '编辑分类' : '新增分类'}</Text>
                </View>
              </View>

              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                // 这里的 keyboardVerticalOffset 需要根据你的标题高度微调
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
              >
                <ScrollView
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>分类名称</Text>
                    <View style={styles.neuInputInset}>
                      <TextInput
                        style={styles.textInput}
                        value={editingCategory.name}
                        onChangeText={(text) =>
                          setEditingCategory({ ...editingCategory, name: text })
                        }
                        placeholder="例如：社交媒体"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>

                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>视觉图标</Text>
                    <View style={styles.iconGrid}>
                      {iconOptions.map((iconName) => (
                        <TouchableOpacity
                          key={iconName}
                          onPress={() => {
                            setEditingCategory({ ...editingCategory, icon: iconName })
                          }}
                          style={[
                            styles.iconBtn,
                            editingCategory.icon === iconName && {
                              borderColor: editingCategory.color,
                              borderWidth: 2,
                            },
                          ]}
                        >
                          <FontAwesome
                            name={iconName}
                            size={20}
                            color={
                              editingCategory.icon === iconName ? editingCategory.color : '#94a3b8'
                            }
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>分类色标</Text>
                    <View style={styles.colorGrid}>
                      {colorOptions.map((color) => (
                        <TouchableOpacity
                          key={color}
                          onPress={() => {
                            setEditingCategory({ ...editingCategory, color: color })
                          }}
                          style={[
                            styles.colorCircle,
                            { backgroundColor: color },
                            editingCategory.color === color && styles.colorCircleActive,
                          ]}
                        >
                          {editingCategory.color === color && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, submitting && { opacity: 0.7 }]}
                    onPress={handleFormSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryActionText}>
                        {isEditMode ? '确认保存' : '立即创建'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </KeyboardAvoidingView>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    )
  }

  const [longPressActiveId, setLongPressActiveId] = useState(null)
  const handleLongPress = async (item) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLongPressActiveId(item.id)
    setSelectedCategory(item)
    setActionVisible(true)
  }
  const dismissActionSheet = () => {
    setActionVisible(false)
    setLongPressActiveId(null)
  }
  const renderActionSheet = () => (
    <Modal
      visible={actionVisible}
      transparent
      animationType="slide"
      onDismiss={() => console.log('iOS: 模态框消失')}
      onRequestClose={dismissActionSheet}
    >
      <Pressable style={styles.modalOverlay2} onPress={dismissActionSheet}>
        <View style={styles.actionSheet}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>{selectedCategory?.name}</Text>

          <TouchableOpacity
            style={[styles.actionBtnContainer]}
            onPress={() => {
              setActionVisible(false)
              handleEditClick(selectedCategory)
            }}
          >
            <LinearGradient
              // 三点渐变：透明 -> 15%蓝色 -> 透明
              colors={['transparent', 'rgba(59, 130, 246, 0.15)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.gradientBg}
            >
              <Text style={[styles.actionText, { color: '#3b82f6' }]}>编辑</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnContainer}
            onPress={() => {
              setActionVisible(false)
              confirmDelete(selectedCategory)
            }}
          >
            <LinearGradient
              // 三点渐变：透明 -> 15%红色 -> 透明
              colors={['transparent', 'rgba(239, 68, 68, 0.15)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.gradientBg}
            >
              <Text style={[styles.actionText, { color: '#ef4444' }]}>删除</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={dismissActionSheet}>
            <Text style={styles.cancelBtnText}>取消操作</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  )
  const confirmDelete = (item) => {
    showConfirm({
      title: '确认删除',
      message: `请确认${item.name}分类下没有存储密码再进行删除，否则无法删除`,
      confirmText: '确定删除',
      onConfirm: async () => {
        try {
          await apiService.delete(`category/${item.id}`)
          dispatch({ type: ACTION_TYPES.DELETE_CATEGORY, payload: item.id })
        } catch (e) {
          Toast.show(e.data.errors[0], {
            position: 0,
          })
        } finally {
          setLongPressActiveId(null)
        }
      },
      onCancel: () => {
        setLongPressActiveId(null)
      },
    })
  }

  const [pressedId, setPressedId] = useState(null)
  const renderContent = () => {
    if (!isInitialized) return <Loading />

    return (
      <View style={styles.gravityGrid}>
        {categories.map((item, index) => {
          const isPressed = pressedId === item.id
          const isLarge = index % 3 === 0
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={1}
              onPressIn={() => setPressedId(item.id)}
              onPressOut={() => setPressedId(null)}
              onPress={() => handleCategoryPress(item)}
              onLongPress={() => handleLongPress(item)}
              delayLongPress={600}
              style={[styles.cellBase, isLarge ? styles.cellLarge : styles.cellSmall]}
            >
              <View
                style={[
                  styles.neuOuter,
                  isPressed && styles.neuOuterPressed,
                  longPressActiveId === item.id && styles.neuOuterLongActive,
                ]}
              >
                <View style={[styles.neuInner, isPressed && styles.neuInnerPressed]}>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{item.passwordsCount || 0}</Text>
                  </View>
                  <View style={[styles.iconBox, isLarge ? styles.iconLarge : styles.iconSmall]}>
                    <FontAwesome
                      name={item.icon || 'folder'}
                      size={isLarge ? 30 : 20}
                      color={item.color || '#3b82f6'}
                    />
                  </View>
                  <Text style={[styles.categoryName, { fontSize: isLarge ? 16 : 13 }]}>
                    {item.name}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* 2. 搜索框 */}
        {categorySearchBar()}

        {/* 3. 分类节点展示 */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>

        <View style={styles.footerDock}>
          <View style={styles.dockBaseShadow}>
            <TouchableOpacity
              style={styles.mainAddBtn}
              activeOpacity={0.8}
              onPress={handleAddClick}
            >
              <LinearGradient
                // 柔和蓝紫渐变（低饱和度）
                colors={['#60a5fa', '#818cf8']}
                start={{ x: 0.2, y: 0.2 }} // 轻微偏移起点
                end={{ x: 0.8, y: 0.8 }} // 轻微偏移终点
                style={styles.addBtnGradient}
              >
                <Ionicons
                  name="add"
                  size={32}
                  color="rgba(255, 255, 255, 0.9)" // 半透明白色增强柔和感
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        {renderActionSheet()}
        {CategoryFormModal()}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0E5EC',
  },
  searchWrapper: {
    paddingHorizontal: 25,
    marginBottom: 15,
    marginTop: 20,
  },
  neuSearchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    ...Platform.select({
      ios: {
        shadowColor: '#A3B1C6',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
      },
    }),
  },
  input: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1e293b' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 160, // 为底部按钮留出空间
  },
  gravityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cellBase: { marginBottom: 18 },
  cellLarge: { width: (width - 60) * 0.61, height: 180 },
  cellSmall: { width: (width - 60) * 0.35, height: 130 },
  neuOuter: {
    flex: 1,
    backgroundColor: '#E0E5EC',
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#A3B1C6',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },
  neuInner: {
    flex: 1,
    borderRadius: 30,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#ffffff',
        shadowOffset: { width: -8, height: -8 },
        shadowOpacity: 1,
        shadowRadius: 10,
      },
    }),
  },
  neuOuterPressed: {
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  neuOuterLongActive: {
    // 1. 使用饱和度更高但色调柔和的“粉蓝色”
    backgroundColor: '#BDE0FE',

    // 2. 将阴影变为蓝色调，模拟灯光亮起
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 }, // 此时阴影向四周均匀扩散
    shadowOpacity: 0.6,
    shadowRadius: 12,

    // 3. Android 的发光处理（Android 对阴影颜色支持有限，主要靠边框辅助）
    elevation: 10,
  },

  neuInnerPressed: {
    borderColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: -1, height: -1 },
    shadowOpacity: 0.2,
  },
  countBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#E0E5EC',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#fff',
  },
  countText: { fontSize: 11, fontWeight: '800', color: '#3b82f6' },
  iconBox: {
    backgroundColor: '#E0E5EC',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  iconLarge: { width: 60, height: 60, marginBottom: 12 },
  iconSmall: { width: 40, height: 40, marginBottom: 8 },
  categoryName: { fontWeight: '800', color: '#444' },

  footerDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(224, 229, 236, 0.85)',
  },
  dockBaseShadow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E5EC',
    justifyContent: 'center',
    alignItems: 'center',
    // 弱化底座阴影，增强柔和感
    ...Platform.select({
      ios: {
        shadowColor: '#A3B1C6',
        shadowOffset: { width: 6, height: 6 }, // 缩小偏移
        shadowOpacity: 0.6, // 降低不透明度
        shadowRadius: 8, // 减小模糊半径
      },
      android: { elevation: 6 }, // 降低 elevation
    }),
  },
  mainAddBtn: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3, // 减细边框
    borderColor: '#E0E5EC',
    transform: [{ scale: 1 }],
    transition: 'transform 0.2s ease',
    // 按钮外层光影（柔和扩散）
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(96, 165, 250, 0.3)', // 浅蓝阴影
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.7,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  // 新增渐变容器样式
  addBtnGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    // 内阴影效果（模拟按钮凹陷感）
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(255, 255, 255, 0.5)',
        shadowOffset: { width: -2, height: -2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
    }),
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  halfModalContent: {
    backgroundColor: '#E0E5EC',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '85%', // 防止弹窗顶满全屏
    // 顶部阴影模拟浮起感
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalFixedHeader: {
    paddingTop: 15,
    backgroundColor: '#E0E5EC', // 确保标题背景不透明，遮挡滚动上来的内容
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    zIndex: 10,
  },
  modalIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputSection: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '800', color: '#64748b', marginBottom: 10 },

  // 凹陷样式的输入框逻辑
  neuInputInset: {
    backgroundColor: '#E0E5EC',
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 15,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    // 内部阴影模拟（React Native 无内阴影，通过偏移模拟）
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  textInput: { color: '#1e293b', fontSize: 16, fontWeight: '600' },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  iconBtn: {
    width: (width - 100) / 4, // 动态计算 4 列布局
    height: 55,
    borderRadius: 15,
    backgroundColor: '#E0E5EC',
    justifyContent: 'center',
    alignItems: 'center',
    // 微凸起
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 6,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#fff',
    transform: [{ scale: 1.2 }],
    // 增加颜色发光感
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  primaryActionBtn: {
    backgroundColor: '#3b82f6',
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  primaryActionText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  modalOverlay2: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  actionBtnContainer: {
    width: '100%',
    height: 64, // 增加高度让扩散效果更舒展
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    height: 58,
    borderRadius: 16,
    justifyContent: 'center', // 垂直居中
    alignItems: 'center', // 水平居中
    marginBottom: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
  },
  cancelBtn: {
    marginTop: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '600',
  },
})
