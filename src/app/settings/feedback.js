import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import * as Device from 'expo-device'
import { useTheme } from '@/theme/useTheme'
import { router } from 'expo-router'
import Constants from 'expo-constants'
import apiService from '@/utils/request'

export default function Feedback() {
  const { theme } = useTheme()
  const [type, setType] = useState('建议') // 默认分类
  const [content, setContent] = useState('')
  const [contact, setContact] = useState(undefined)

  const feedBackTypes = ['建议', 'BUG', 'UI问题', '其他']
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (isSubmitting) return
    if (content.trim().length < 5) {
      Alert.alert('提示', '请多写一点描述吧，至少5个字哦')
      return
    }

    if (content.length > 200) {
      Alert.alert('提示', '描述内容过长，请精简至200字以内')
      return
    }

    const payload = {
      feedbackType: type,
      content,
      contact,
      deviceInfo: {
        model: Device.modelName,
        os: `${Device.osName} ${Device.osVersion}`,
        appVersion: Constants.expoConfig.version,
      },
    }

    setIsSubmitting(true)
    try {
      await apiService.post('/user/feedback', payload)

      Alert.alert('感谢您的反馈！', '我们会尽快处理您的建议或问题。', [
        {
          text: '好的',
          onPress: () => router.back(),
        },
      ])
    } catch (error) {
      Alert.alert('错误', '无法唤起邮件客户端，请检查系统设置')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* 1. 分类选择 */}
        <Text style={[styles.label, { color: theme.text, opacity: 0.6 }]}>反馈类型</Text>
        <View style={styles.tagContainer}>
          {feedBackTypes.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.tag, { backgroundColor: type === item ? '#007AFF' : theme.card }]}
              onPress={() => setType(item)}
            >
              <Text style={{ color: type === item ? '#fff' : theme.text, fontSize: 13 }}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 2. 描述输入框 */}
        <Text style={[styles.label, { color: theme.text, opacity: 0.6 }]}>详细描述</Text>
        <TextInput
          multiline
          placeholder="请描述您遇到的问题或建议..."
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            {
              backgroundColor: theme.textInputBackground,
              color: theme.text,
              textAlignVertical: 'top',
            },
          ]}
          value={content}
          onChangeText={setContent}
        />

        {/* 3. 联系方式 */}
        <Text style={[styles.label, { color: theme.text, opacity: 0.6 }]}>联系方式 (选填)</Text>
        <TextInput
          placeholder="邮箱/QQ/微信"
          placeholderTextColor="#999"
          style={[
            styles.contactInput,
            { backgroundColor: theme.textInputBackground, color: theme.text },
          ]}
          value={contact}
          onChangeText={setContact}
        />

        {/* 5. 提交按钮 */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
          disabled={isSubmitting}
          onPress={handleSubmit}
        >
          <Text style={styles.submitBtnText}>{isSubmitting ? '提交中...' : '提交反馈'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  label: { fontSize: 14, marginBottom: 10, marginTop: 20 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  input: {
    height: 150,
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
  },
  contactInput: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: '#007AFF',
    height: 55,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
})
