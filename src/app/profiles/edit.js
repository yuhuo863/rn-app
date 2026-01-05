import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { useState } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import apiService from '@/utils/request'
import { useTheme } from '@/theme/useTheme'
import useNotifyStore from '@/stores/useNotifyStore'

export default function ProfileEdit() {
  const { theme } = useTheme()
  const router = useRouter()
  const initialData = useLocalSearchParams()

  // 表单状态
  const [username, setUsername] = useState(initialData.username || '')
  const [email, setEmail] = useState(initialData.email || '')
  const [sex, setSex] = useState(initialData.sex !== undefined ? Number(initialData.sex) : 2)

  // 头像状态
  const [avatarUri, setAvatarUri] = useState(initialData.avatar || null)
  const [isNewAvatar, setIsNewAvatar] = useState(false) // 标记是否换了新头像
  const [saving, setSaving] = useState(false)

  // 1. 选择图片逻辑
  const pickImage = async () => {
    try {
      // 请求权限
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (permissionResult.granted === false) {
        Alert.alert('需要权限', '请允许访问相册以修改头像')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        // 在 Android 或 Web 上，作为媒体类型传递的 livePhotos 类型将被忽略。
        // livePhotos 仅限 IOS
        mediaTypes: ['images', 'livePhotos'],
        allowsEditing: true,
        aspect: [1, 1], // 限制为正方形
        quality: 0.8, // 压缩质量
      })

      if (!result.canceled) {
        setAvatarUri(result.assets[0].uri) // 预览本地图片
        setIsNewAvatar(true) // 标记需要上传
      }
    } catch (error) {
      Alert.alert('错误', '图片选择失败')
    }
  }

  const uploadToAliOSS = async (localUri) => {
    // 构造表单数据
    const formData = new FormData()
    const fileName = localUri.split('/').pop()
    const match = /\.(\w+)$/.exec(fileName)
    const type = match ? `image/${match[1]}` : `image`

    const photo = {
      uri: Platform.OS === 'android' ? localUri : localUri.replace('file://', ''),
      type: type, // 例如 'image/jpeg'
      name: fileName || 'upload.jpg',
    }
    formData.append('file', photo)

    try {
      const response = await apiService.post('/user/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data,
      })
      return response.file.url
    } catch (e) {
      Alert.alert('错误', '头像上传失败')
    }
  }

  const handleSave = async () => {
    if (!username.trim()) return Alert.alert('提示', '用户名不能为空')

    setSaving(true)

    try {
      // 默认为原头像
      let finalAvatarUrl = initialData.avatar

      // 如果用户换了头像，先上传图片
      if (isNewAvatar && avatarUri) {
        finalAvatarUrl = await uploadToAliOSS(avatarUri)
      }

      // 构建提交给后端的数据
      const updatePayload = {
        username,
        email,
        sex,
        avatar: finalAvatarUrl,
      }

      await apiService.put('/user/me', updatePayload)

      setIsNewAvatar(false)

      useNotifyStore.getState().notifyProfileUpdated()

      Alert.alert('成功', '资料已更新', [{ text: '确定', onPress: () => router.back() }])
    } catch (error) {
      Alert.alert('失败', error?.data?.errors[0] || '更新失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#e29447" />
          ) : (
            <Text style={styles.saveText}>保存</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 头像编辑区域 */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            <Image
              source={avatarUri ? { uri: avatarUri } : null}
              style={styles.avatar}
              contentFit="cover"
            />
            {/* 覆盖层，提示点击 */}
            <View style={styles.cameraIconOverlay}>
              <Ionicons name="camera" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarTip}>点击更换头像</Text>
        </View>

        {/* 表单区域 */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>用户名</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.textInputBackground,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            value={username}
            onChangeText={setUsername}
            placeholder="设置你的用户名"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>性别</Text>
          <View style={styles.genderContainer}>
            {[
              { label: '男', value: 1, icon: 'male' },
              { label: '女', value: 0, icon: 'female' },
              { label: '保密', value: 2, icon: 'help' },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.genderBtn,
                  { backgroundColor: theme.background, borderColor: theme.border },
                  sex === item.value && [
                    styles.genderBtnSelected,
                    { backgroundColor: theme.selectedOption, borderColor: 'transparent' },
                  ],
                ]}
                onPress={() => setSex(item.value)}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={sex === item.value ? '#fff' : '#666'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    [styles.genderText, { color: theme.text }],
                    sex === item.value && [styles.genderTextSelected, { color: theme.text }],
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>电子邮箱</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.textInputBackground,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.helperText}>请确保邮箱有效，修改密码时需要进行验证</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveText: {
    fontSize: 16,
    color: '#e29447',
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTip: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
  },
  formGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
    marginLeft: 3,
  },
  input: {
    height: 50,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
  },
  helperText: {
    marginTop: 8,
    marginLeft: 3,
    fontSize: 13,
    color: '#f87171',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 45,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  genderBtnSelected: {
    backgroundColor: '#e29447',
    borderColor: '#e29447',
  },
  genderText: {
    fontSize: 15,
    color: '#666',
  },
  genderTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
})
