import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, Alert } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Loading from '@/components/shared/Loading'
import apiService from '@/utils/request'

export default function ForgotPassword({ setSelected }) {
  // Form State
  const [form, setForm] = useState({
    email: '',
    code: '',
  })

  // UI State
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')

  // Countdown Logic
  useEffect(() => {
    let interval = null
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [countdown])

  // Input Handler
  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (error) setError('')
  }

  // Action 1: Send Verification Code
  const handleSendCode = async () => {
    Keyboard.dismiss()
    if (!form.email || !form.email.includes('@')) {
      setError('请输入有效的邮箱地址')
      return
    }

    setCountdown(60)
    try {
      await apiService.post('/user/send-captcha', { email: form.email })
      Alert.alert('提示', '验证码已发送至您的邮箱，请查收。')
    } catch (error) {
      setCountdown(0)
      Alert.alert('错误', error?.data?.errors[0] || '验证码发送失败')
    }
  }

  // Action 2: Verify Code & Trigger Account Wipe Warning
  const handleVerifyAndWipe = async () => {
    Keyboard.dismiss()
    if (!form.email) return setError('请输入邮箱')
    if (!form.code || form.code.length < 4) return setError('请输入正确的验证码')

    setLoading(true)
    try {
      // 1. Verify the code first to prove ownership
      await apiService.post('/user/verify-captcha', {
        email: form.email,
        code: form.code,
      })

      setLoading(false)

      // 2. Show the "Hardcore" Warning
      Alert.alert(
        '🚨 危险操作警告',
        '由于本应用采用零知识加密，我们无法直接重置您的主密码。\n\n继续操作将【注销当前账号】并【永久销毁】所有已存储的加密数据。\n\n您可以使用原邮箱重新注册一个全新的空账号。确定要继续吗？',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确定销毁并注销',
            style: 'destructive',
            onPress: handleExecuteWipe,
          },
        ],
      )
    } catch (error) {
      setLoading(false)
      Alert.alert('验证失败', error?.data?.errors[0] || '验证码错误')
    }
  }

  // Action 3: Execute Account Destruction
  const handleExecuteWipe = async () => {
    setLoading(true)
    try {
      // Call the destructive endpoint
      await apiService.post('/user/wipe-account', { email: form.email })

      Alert.alert('账号已注销', '您的旧数据已被安全销毁。现在您可以使用该邮箱重新注册。', [
        { text: '去注册', onPress: () => setSelected('signUp') },
      ])
    } catch (error) {
      Alert.alert('操作失败', error?.data?.errors[0] || '注销失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainContent}>
          <Text style={styles.title}>忘记主密码？</Text>

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠️ 注意：丢失主密码意味着丢失所有数据。</Text>
            <Text style={styles.warningSubText}>
              我们不存储您的主密码。如果您无法找回密码，唯一的选择是验证身份后销毁账号，并重新开始。
            </Text>
          </View>

          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>电子邮箱</Text>
              <View style={[styles.inputWrapper, error.includes('邮箱') && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="example@mail.com"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.email}
                  onChangeText={(text) => handleChange('email', text)}
                />
              </View>
            </View>

            {/* Captcha Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>验证码</Text>
              <View style={[styles.inputWrapper, error.includes('验证码') && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="输入验证码"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={form.code}
                  onChangeText={(text) => handleChange('code', text)}
                />
                <View style={styles.verticalLine} />
                <TouchableOpacity onPress={handleSendCode} disabled={countdown > 0}>
                  <Text style={[styles.codeBtnText, countdown > 0 && styles.codeBtnTextDisabled]}>
                    {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Destructive Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleVerifyAndWipe}
              style={styles.submitBtn}
              disabled={loading}
            >
              <Text style={styles.submitBtnText}>验证并销毁账号</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelected('signIn')}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>想起密码了？去登录</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>需要帮助？</Text>
          <TouchableOpacity>
            <Text style={styles.contactSupport}>查看安全文档</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {loading && <Loading message={'正在处理...'} />}
    </View>
  )
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 20 },
  mainContent: { marginTop: 30 },

  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },

  // Warning Box Styles
  warningBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  warningText: {
    color: '#FF3B30',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  warningSubText: {
    color: '#FF3B30',
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.9,
  },

  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: { borderColor: '#FF3B30', backgroundColor: '#FFF0F0' },
  input: { flex: 1, fontSize: 16, color: '#1A1A1A', height: '100%' },

  verticalLine: { width: 1, height: 20, backgroundColor: '#D1D1D6', marginHorizontal: 12 },
  codeBtnText: { color: '#629BF0', fontWeight: '600', fontSize: 14 },
  codeBtnTextDisabled: { color: '#A0A0A0' },

  errorText: { fontSize: 13, color: '#FF3B30', marginBottom: 16, textAlign: 'center' },

  submitBtn: {
    height: 56,
    backgroundColor: '#FF3B30', // Changed to Red to indicate destructive action
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnText: { fontSize: 18, fontWeight: '600', color: '#fff' },

  backButton: { marginTop: 16, alignItems: 'center', padding: 10 },
  backButtonText: { color: '#8E8E93', fontSize: 14 },

  footer: { marginTop: 'auto', paddingTop: 40, flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: '#8E8E93', fontSize: 14 },
  contactSupport: { color: '#629BF0', fontSize: 14, fontWeight: '600', marginLeft: 4 },
})
