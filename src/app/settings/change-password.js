import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/theme/useTheme'
import apiService from '@/utils/request'
import useAuthStore from '@/stores/useAuthStore'
import { resetMasterKeyAndReEncrypt } from '@/utils/crypto'

export default function ChangePassword() {
  const router = useRouter()
  const { theme } = useTheme()

  const [loading, setLoading] = useState(false)
  const [secureEntry, setSecureEntry] = useState(true)
  const [currentPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [progress, setProgress] = useState(0)

  const handleUpdatePassword = async () => {
    // 1. 基础非空校验
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('提示', '请填写所有密码字段')
      return
    }

    // 2. 新旧密码一致性校验
    if (currentPassword === newPassword) {
      Alert.alert('提示', '新密码不能与当前密码相同')
      return
    }

    // 3. 两次新密码一致性校验
    if (newPassword !== confirmPassword) {
      Alert.alert('校验失败', '两次输入的密码不一致')
      return
    }

    // 4. 长度校验
    if (newPassword.length < 8) {
      Alert.alert('校验失败', '新密码长度至少为 8 位')
      return
    }

    setLoading(true)
    setProgress(0)
    try {
      const { masterKey, user, system_pepper } = useAuthStore.getState()
      const response = await apiService.get('/password')
      const allItems = response?.passwords || []

      if (!masterKey) {
        Alert.alert('错误', '主密钥已失效，请重新登录')
        return
      }
      if (!user || !user.id) {
        Alert.alert('错误', '用户信息已失效，请重新登录')
        return
      }
      // 重新加密所有密码项，并更新 masterKey
      const { reEncryptedItems } = await resetMasterKeyAndReEncrypt(
        allItems,
        masterKey,
        newPassword,
        user.id,
        system_pepper,
        (p) => setProgress(p), // 更新进度条
      )

      // 2. 发起请求，重置主密码并更新服务器密码项数据
      await apiService.post('/user/reset-master-password', {
        currentPassword,
        newPassword,
        items: reEncryptedItems,
      })

      // 3. 强制重新登录
      Alert.alert('成功', '密码已成功修改，请重新登录', [
        { text: '确定', onPress: () => router.replace('/auth/sign-out') },
      ])
    } catch (error) {
      Alert.alert('失败', error?.data?.errors[0] || error.message || '当前密码错误或系统繁忙')
      setLoading(false)
    }
  }

  const renderContent = () => {
    return (
      <View style={styles.content}>
        <Text style={[styles.guideText, { color: theme.textSecondary }]}>
          为了保障您的账号安全，请定期更换密码。
        </Text>

        {/* 当前密码 */}
        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>当前密码</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.textInputBackground }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              secureTextEntry={secureEntry}
              value={currentPassword}
              onChangeText={setOldPassword}
              placeholder="请输入当前密码"
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        </View>

        {/* 新密码 */}
        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>新密码</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.textInputBackground }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              secureTextEntry={secureEntry}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="设置新密码 (不少于8位)"
              placeholderTextColor={theme.textSecondary}
            />
            <TouchableOpacity onPress={() => setSecureEntry(!secureEntry)}>
              <Ionicons
                name={secureEntry ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 确认新密码 */}
        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>确认新密码</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.textInputBackground }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              secureTextEntry={secureEntry}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="再次输入新密码"
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        </View>

        {/* 保存按钮 */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.buttonColor }]}
          onPress={handleUpdatePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>确认更新</Text>
          )}
        </TouchableOpacity>
      </View>
    )
  }
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {renderContent()}
      <Modal
        transparent
        visible={loading}
        animationType="fade"
        onRequestClose={() => {
          Alert.alert('安全提示', '正在重加密数据，请稍等...')
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <ActivityIndicator size="large" color={theme.buttonColor} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>更新密码</Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${progress}%`, backgroundColor: theme.buttonColor },
                ]}
              />
            </View>
            <Text style={[styles.modalProgressText, { color: theme.textSecondary }]}>
              正在重加密数据... {progress}%
            </Text>
            <Text style={styles.modalWarning}>请勿关闭应用或切换后台</Text>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  content: { padding: 24 },
  guideText: { fontSize: 14, marginBottom: 30, lineHeight: 20 },
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: { flex: 1, fontSize: 16, height: '100%' },
  saveButton: {
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBar: { height: '100%' },
  modalProgressText: { marginTop: 12, fontSize: 14 },
  modalWarning: { marginTop: 8, fontSize: 12, color: '#ff4d4f', fontWeight: '500' },
})
