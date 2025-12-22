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
import { useCategoryContext } from '@/utils/context/CategoryContext'

import { useTheme } from '@/theme/useTheme'

export default function PasswordFormModal({
  visible,
  onClose,
  onSuccess,
  mode = 'create', // 'create' 或 'edit'
  initialData = null, // 编辑模式下的初始数据
  categoryMap = null,
}) {
  const theme = useTheme()
  const { refreshCategories } = useCategoryContext()
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [formParams, setFormParams] = useState({
    title: '',
    username: '',
    encrypted_password: '',
    site_url: undefined,
    notes: undefined,
    categoryId: undefined,
  })

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && initialData) {
        setFormParams({
          title: initialData.title || '',
          username: initialData.username || '',
          encrypted_password: initialData.password || '',
          site_url: initialData.site_url || undefined,
          notes: initialData.notes || undefined,
          categoryId: initialData.categoryId || initialData.category?.id || undefined,
        })
      } else if (mode === 'create') {
        setFormParams({
          title: '',
          username: '',
          encrypted_password: '',
          site_url: undefined,
          notes: undefined,
          categoryId: undefined,
        })
      }
    }
  }, [visible, mode, initialData])

  const onChangeText = (text, name) => {
    setFormParams((prev) => ({ ...prev, [name]: text === '' ? undefined : text })) // 可选字段为空时传 undefined
  }

  const handleSubmit = async () => {
    if (!formParams.title.trim()) return Alert.alert('提示', '请输入标题')

    setLoadingSubmit(true)
    try {
      if (mode === 'edit') {
        await apiService.put(`/password/${initialData.id}`, formParams)
      } else {
        await apiService.post('/password', formParams)
      }

      await refreshCategories() //

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
                value={formParams.encrypted_password}
                onChangeText={(t) => onChangeText(t, 'encrypted_password')}
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
