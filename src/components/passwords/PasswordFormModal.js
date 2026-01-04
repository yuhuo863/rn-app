import React, { useEffect, useState } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import apiService from '@/utils/request'
import Loading from '@/components/shared/Loading'

import useCategoryStore from '@/stores/useCategoryStore'
import useAuthStore from '@/stores/useAuthStore'
import { useTheme } from '@/theme/useTheme'
import { encryptField } from '@/utils/crypto'

export default function PasswordFormModal({
  visible,
  onClose,
  onSuccess,
  mode = 'create', // 'create' 或 'edit'
  initialData = null, // 编辑模式下的初始数据
  categoryMap = null,
}) {
  const { theme } = useTheme()
  const { fetchCategories } = useCategoryStore()
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [formParams, setFormParams] = useState({
    title: '',
    username: '',
    password: '',
    site_url: undefined,
    notes: undefined,
    categoryId: undefined,
  })

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && initialData) {
        // 假设进入编辑模式时，父组件已经把密文解密成了明文传进来
        // 如果 initialData 还是密文，这里需要先解密再 setFormParams
        setFormParams({
          title: initialData.title || '',
          username: initialData.username || '',
          password: initialData.password || '',
          site_url: initialData.site_url || undefined,
          notes: initialData.notes || undefined,
          categoryId: initialData.categoryId || initialData.category?.id || undefined,
        })
      } else if (mode === 'create') {
        setFormParams({
          title: '',
          username: '',
          password: '',
          site_url: undefined,
          notes: undefined,
          categoryId: undefined,
        })
      }
    }
  }, [visible, mode, initialData])

  const onChangeText = (text, name) => {
    // 可选字段为空时需要传 undefined
    setFormParams((prev) => ({ ...prev, [name]: text === '' ? undefined : text }))
  }

  const handleSubmit = async () => {
    if (!formParams.title.trim()) return Alert.alert('提示', '请输入标题')
    const { masterKey } = useAuthStore.getState()
    if (!masterKey) return Alert.alert('错误', '加密密钥丢失，请重新登录')

    setLoadingSubmit(true)
    try {
      // 1. 准备加密 Payload
      // 我们保留 categoryId 为明文，其他字段全部在客户端加密
      const encryptedPayload = {
        categoryId: formParams.categoryId || undefined, // 分类ID不加密，便于后端索引

        // 使用 masterKey 对每个字段独立加密
        // encryptField 返回格式通常为 "IV字符串|密文字符串" 或 Base64
        title: encryptField(formParams.title, masterKey),
        username: encryptField(formParams.username, masterKey),
        password: encryptField(formParams.password, masterKey),

        // 可选字段，有值才加密
        site_url: formParams.site_url ? encryptField(formParams.site_url, masterKey) : undefined,
        notes: formParams.notes ? encryptField(formParams.notes, masterKey) : undefined,
      }
      // 2. 发送密文到后端
      // 后端只负责存这些乱码字符串，完全不知道内容
      if (mode === 'edit') {
        await apiService.put(`/password/${initialData.id}`, encryptedPayload)
      } else {
        await apiService.post('/password', encryptedPayload)
      }

      await fetchCategories() // 更新分类列表

      onSuccess()
      onClose()
    } catch (error) {
      Alert.alert('错误', error.data?.errors?.[0] || '操作失败')
    } finally {
      setLoadingSubmit(false)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          {loadingSubmit && <Loading />}

          <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {mode === 'edit' ? '编辑账号信息' : '添加新账号'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* 分类选择 */}
            <View
              style={[
                styles.inputGroup,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  borderBottomWidth: 1,
                },
              ]}
            >
              <View style={styles.iconBox}>
                <FontAwesome name="folder-open" size={18} color={theme.textSecondary} />
              </View>
              <Picker
                selectedValue={formParams.categoryId}
                onValueChange={(val) => onChangeText(val, 'categoryId')}
                style={styles.picker}
                mode="dropdown"
                dropdownIconColor={theme.textSecondary}
                selectionColor={theme.textSecondary}
              >
                <Picker.Item
                  label="选择分类..."
                  value={null}
                  color={theme.textSecondary}
                  style={{
                    backgroundColor: theme.background,
                  }}
                />
                {categoryMap?.categories?.map((cat) => (
                  <Picker.Item
                    label={cat.name}
                    value={cat.id}
                    key={cat.id}
                    color={theme.textSecondary}
                    style={{
                      color: theme.textSecondary,
                      backgroundColor: theme.background,
                    }}
                  />
                ))}
              </Picker>
            </View>

            {/* 标题 */}
            <View
              style={[
                styles.inputGroup,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  borderBottomWidth: 1,
                },
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              <View style={styles.iconBox}>
                <FontAwesome name="tag" size={18} color={theme.textSecondary} />
              </View>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="标题"
                placeholderTextColor={theme.textSecondary}
                value={formParams.title}
                onChangeText={(t) => onChangeText(t, 'title')}
              />
            </View>

            {/* 用户名 */}
            <View
              style={[
                styles.inputGroup,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  borderBottomWidth: 1,
                },
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              <View style={styles.iconBox}>
                <FontAwesome name="user" size={18} color={theme.textSecondary} />
              </View>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="用户名"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                value={formParams.username}
                onChangeText={(t) => onChangeText(t, 'username')}
              />
            </View>

            {/* 密码 */}
            <View
              style={[
                styles.inputGroup,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  borderBottomWidth: 1,
                },
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              <View style={styles.iconBox}>
                <FontAwesome name="lock" size={18} color={theme.textSecondary} />
              </View>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="密码"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={formParams.password}
                onChangeText={(t) => onChangeText(t, 'password')}
              />
            </View>

            {/* 网址 */}
            <View
              style={[
                styles.inputGroup,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  borderBottomWidth: 1,
                },
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              <View style={styles.iconBox}>
                <FontAwesome name="globe" size={18} color={theme.textSecondary} />
              </View>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="网站地址 (可选)"
                placeholderTextColor={theme.textSecondary}
                value={formParams.site_url}
                onChangeText={(t) => onChangeText(t, 'site_url')}
              />
            </View>

            {/* 备注 */}
            <View
              style={[
                styles.inputGroup,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  borderBottomWidth: 1,
                },
                {
                  height: 'auto',
                  minHeight: 80,
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={[styles.iconBox, { paddingTop: 12 }]}>
                <FontAwesome name="pencil" size={18} color={theme.textSecondary} />
              </View>
              <TextInput
                style={[styles.input, { height: 80, color: theme.text }]}
                placeholder="备注 (可选)"
                placeholderTextColor={theme.textSecondary}
                multiline
                value={formParams.notes}
                onChangeText={(t) => onChangeText(t, 'notes')}
              />
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSubmit}
            >
              <Text style={styles.saveButtonText}>{mode === 'edit' ? '保存修改' : '立即创建'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  formContainer: { padding: 24 },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    height: 54,
    paddingHorizontal: 12,
  },
  iconBox: { width: 32, alignItems: 'center', marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: '#1e293b' },
  picker: { flex: 1 },
  modalButtons: { padding: 24 },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
