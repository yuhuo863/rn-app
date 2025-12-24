import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
} from 'react-native'
import { Stack, Link, useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons, FontAwesome } from '@expo/vector-icons'
import useFetchData from '@/hooks/useFetchData'
import NetworkError from '@/components/shared/NetworkError'
import Loading from '@/components/shared/Loading'
import apiService from '@/utils/request'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Clipboard from 'expo-clipboard'
import Toast from 'react-native-root-toast'
import PasswordFormModal from '@/components/passwords/PasswordFormModal'
import { useCategoryContext } from '@/utils/context/CategoryContext'
import { useTheme } from '@/theme/useTheme'
import * as SecureStore from 'expo-secure-store'

export default function Password() {
  const { theme } = useTheme()

  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { data, loading, error, onReload } = useFetchData(`/password/${id}`)
  const [deleting, setDeleting] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)

  const [editVisible, setEditVisible] = useState(false)
  const {
    state: { categories },
    refreshCategories,
  } = useCategoryContext()

  const handleDelete = async () => {
    setDeleteModalVisible(false)
    setDeleting(true)
    try {
      await apiService.delete(`/password/${id}`)
      await refreshCategories() // 用于刷新分类列表对应分类的passwordsCount

      setDeleting(false)
      setDeleteModalVisible(false)
      router.push({
        pathname: '/passwords',
        params: { refresh: Date.now() },
      })
    } catch (err) {
      Alert.alert('错误', '删除失败，请稍后重试')
    } finally {
      setDeleting(false)
    }
  }

  const ConfirmDeleteModal = () => (
    <Modal
      visible={deleteModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setDeleteModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.alertBox, { backgroundColor: theme.background }]}>
          {/* 顶部警告图标 */}
          <View style={styles.warningIconContainer}>
            <Ionicons name="alert-circle" size={40} color="#ef4444" />
          </View>

          <Text style={[styles.alertTitle, { color: theme.text }]}>确认删除？</Text>
          <Text style={[styles.alertMessage, { color: theme.textSecondary }]}>
            删除后该账号密码将被移入回收站。
          </Text>

          <View style={styles.alertButtonGroup}>
            {/* 取消按钮 */}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteModalVisible(false)}>
              <Text style={styles.cancelBtnText}>取消</Text>
            </TouchableOpacity>

            {/* 确认删除按钮 */}
            <TouchableOpacity style={styles.confirmBtn} onPress={handleDelete}>
              <Text style={styles.confirmBtnText}>确定删除</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  const copyToClipboard = async (text, label) => {
    if (!text) return
    try {
      await Clipboard.setStringAsync(text)
      Toast.show(`${label}已复制`, {
        duration: Toast.durations.SHORT,
        position: Toast.positions.CENTER,
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,
        backgroundColor: '#334155', // 可以自定义背景色，建议与你的主题 darkGray 一致
        textColor: '#ffffff',
        containerStyle: {
          borderRadius: 20,
          paddingHorizontal: 20,
        },
      })
      // 3. (可选) 加入触感反馈
      // import * as Haptics from 'expo-haptics';
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      Alert.alert('错误', '复制失败，请重试')
    }
  }

  const renderContent = () => {
    if (loading) return <Loading />
    if (error) return <NetworkError onReload={onReload} />

    const item = data.password

    return (
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 顶部大卡片：图标与标题 */}
          <View style={styles.headerCard}>
            <View
              style={[
                styles.iconBigBox,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              <FontAwesome
                name={item.category?.icon || 'lock'}
                size={40}
                color={item.category.color}
              />
            </View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>{item.title}</Text>
            {item.category?.name && (
              <View style={[styles.categoryBadge, { backgroundColor: theme.background }]}>
                <Text style={[styles.categoryText, { color: theme.textSecondary }]}>
                  {item.category.name}
                </Text>
              </View>
            )}

            {item.site_url && (
              <TouchableOpacity
                style={[
                  styles.urlContainer,
                  { backgroundColor: theme.background, borderColor: theme.border },
                ]}
                onPress={() => copyToClipboard(item.site_url, '网址')}
              >
                <FontAwesome name="globe" size={14} color="#64748b" />
                <Text style={styles.urlText} numberOfLines={1}>
                  {item.site_url}
                </Text>
                <Ionicons name="copy-outline" size={14} color="#3b82f6" />
              </TouchableOpacity>
            )}
          </View>

          {/* 详情信息板块 */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>账号信息</Text>

            <View
              style={[
                styles.infoCard,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              {/* 用户名 */}
              <View style={styles.rowItem}>
                <View style={styles.labelBox}>
                  <FontAwesome name="user" size={16} color="#94a3b8" />
                  <Text style={[styles.labelText, { color: theme.text }]}>用户名</Text>
                </View>
                <View style={styles.valueBox}>
                  <Text style={[styles.valueText, { color: theme.textSecondary }]} selectable>
                    {item.username || '未设置'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(item.username, '用户名')}
                    style={styles.copyBtn}
                  >
                    <Ionicons name="copy-outline" size={18} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              {/* 密码 */}
              <View style={styles.rowItem}>
                <View style={styles.labelBox}>
                  <FontAwesome name="key" size={16} color="#94a3b8" />
                  <Text style={[styles.labelText, { color: theme.text }]}>密码</Text>
                </View>
                <View style={styles.valueBox}>
                  <Text style={[styles.passwordText, { color: theme.textSecondary }]} selectable>
                    {item.password}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 备注板块 */}
          {item.notes ? (
            <View style={styles.sectionContainer}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={styles.sectionTitle}>备注</Text>
                <Link href={`/notes/${item.id}?details=${item.notes}`} asChild>
                  <TouchableOpacity>
                    <Text style={{ color: '#3b82f6', fontSize: 14 }}>全屏查看</Text>
                  </TouchableOpacity>
                </Link>
              </View>
              <View
                style={[
                  styles.infoCard,
                  { backgroundColor: theme.background, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.notesText, { color: theme.text }]} numberOfLines={3}>
                  {item.notes}
                </Text>
              </View>
            </View>
          ) : null}

          {/* 底部占位，防止被按钮遮挡 */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* 底部固定按钮区 */}
        <View
          style={[
            styles.bottomActionContainer,
            { backgroundColor: theme.background, borderTopColor: theme.border },
          ]}
        >
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setDeleteModalVisible(true)}
            disabled={deleting}
          >
            {deleting ? (
              <Text style={styles.deleteButtonText}>删除中...</Text>
            ) : (
              <>
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#ef4444"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.deleteButtonText}>删除</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.editButton} onPress={() => setEditVisible(true)}>
            <FontAwesome name="pencil" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.editButtonText}>编辑资料</Text>
          </TouchableOpacity>
        </View>
        {ConfirmDeleteModal()}
        <PasswordFormModal
          visible={editVisible}
          mode="edit"
          initialData={data.password}
          categoryMap={{ categories }}
          onClose={() => setEditVisible(false)}
          onSuccess={async () => {
            await onReload()
            await SecureStore.setItemAsync('passwordListNeedsRefresh', 'true')
          }}
        />
      </View>
    )
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['bottom']}
    >
      <Stack.Screen
        options={{
          title: '密码详情', // 隐藏默认标题，使用自定义头部
          headerStyle: { backgroundColor: theme.card }, // 与背景同色
          headerShadowVisible: false, // 去掉阴影
          headerTintColor: theme.headerTint,
        }}
      />
      {renderContent()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
  },

  // 头部大卡片样式
  headerCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBigBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#eff6ff', // 浅蓝背景
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  urlText: {
    fontSize: 13,
    color: '#64748b',
    maxWidth: 200,
  },

  // 分区标题
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    marginLeft: 4,
  },

  // 信息卡片（白色圆角）
  infoCard: {
    backgroundColor: '#000',
    borderRadius: 16,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    padding: 16,
    // 阴影
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  // 行布局
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  labelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
  },
  labelText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  valueBox: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    marginRight: 8,
    textAlign: 'right',
    flexShrink: 1,
  },
  passwordText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // 等宽字体显示密码更佳
    marginRight: 8,
    textAlign: 'right',
  },
  copyBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },

  notesText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
  },

  // 底部按钮区域
  bottomActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 16,
    // 底部阴影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 10,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fee2e2', // 浅红背景
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ef4444', // 红色文字
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    flex: 2, // 编辑按钮更宽，突出主要操作
    flexDirection: 'row',
    backgroundColor: '#3b82f6', // 主色蓝
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // 蒙层颜色加深
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    // iOS 阴影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    // Android 阴影
    elevation: 10,
  },
  warningIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  alertButtonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ef4444', // 危险红
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
})
