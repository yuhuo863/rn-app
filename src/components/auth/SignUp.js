import { Link } from 'expo-router'
import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { KeyboardProvider, KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { useSession } from '@/utils/ctx'
import Loading from '@/components/shared/Loading'

export default function SignUp(props) {
  const { setSelected } = props
  const { signUp } = useSession()

  // 状态管理
  const [hidePassword, setHidePassword] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({}) // 用于存储字段错误信息

  const [formParams, setFormParams] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '', // 确保这个字段也在状态中
  })

  // 统一处理输入，输入时自动清除对应的错误提示
  const onChangeText = (text, name) => {
    setFormParams((prev) => ({
      ...prev,
      [name]: text,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  // 表单验证逻辑
  const validate = () => {
    Keyboard.dismiss()
    let valid = true
    let newErrors = {}

    // 1. 邮箱验证 (简单正则)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formParams.email) {
      newErrors.email = '请输入电子邮箱'
      valid = false
    } else if (!emailRegex.test(formParams.email)) {
      newErrors.email = '邮箱格式不正确'
      valid = false
    }

    // 2. 用户名验证
    if (!formParams.username) {
      newErrors.username = '请输入用户名'
      valid = false
    } else if (formParams.username.length < 5) {
      newErrors.username = '用户名至少需要5位'
      valid = false
    }

    // 3. 密码验证
    if (!formParams.password) {
      newErrors.password = '请输入密码'
      valid = false
    }

    // 4. 确认密码验证 (安全性关键)
    if (formParams.password !== formParams.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  // 提交处理
  const handleSubmit = () => {
    Keyboard.dismiss()
    if (!validate()) return

    setLoading(true)

    // 构造发送给后端的 payload
    const { confirmPassword, ...payload } = formParams

    signUp(payload, setLoading)
  }

  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            bottomOffset={120}
            enableOnAndroid={true}
          >
            {/* --- 顶部区域 --- */}
            <View style={styles.header}>
              <Link href="../" asChild>
                <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                  <Text style={styles.cancelText}>跳过</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* --- 主内容区域 --- */}
            <View style={styles.mainContent}>
              <Text style={styles.title}>创建账户</Text>

              <View style={styles.form}>
                {/* 1. 邮箱输入 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>电子邮箱</Text>
                  <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="name@example.com"
                      placeholderTextColor="#A0A0A0"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={formParams.email}
                      onChangeText={(text) => onChangeText(text, 'email')}
                    />
                  </View>
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                {/* 2. 用户名输入 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>用户名</Text>
                  <View style={[styles.inputWrapper, errors.username && styles.inputError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="英文或数字，至少5位"
                      placeholderTextColor="#A0A0A0"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={formParams.username}
                      onChangeText={(text) => onChangeText(text, 'username')}
                    />
                  </View>
                  {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                </View>

                {/* 3. 密码输入 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>密码</Text>
                  <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="设置登录密码"
                      placeholderTextColor="#A0A0A0"
                      autoCapitalize="none"
                      secureTextEntry={hidePassword}
                      value={formParams.password}
                      textContentType="newPassword" // iOS 优化
                      onChangeText={(text) => onChangeText(text, 'password')}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setHidePassword(!hidePassword)}
                      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    >
                      <MaterialCommunityIcons
                        name={hidePassword ? 'eye-off' : 'eye-outline'}
                        size={22}
                        color="#8E8E93"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                {/* 4. 确认密码 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>确认密码</Text>
                  <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="再次输入密码"
                      placeholderTextColor="#A0A0A0"
                      autoCapitalize="none"
                      secureTextEntry={hidePassword} // 跟随主密码显示状态
                      value={formParams.confirmPassword}
                      textContentType="newPassword"
                      onChangeText={(text) => onChangeText(text, 'confirmPassword')}
                    />
                  </View>
                  {errors.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  )}
                </View>

                {/* 注册按钮 */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSubmit}
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                  disabled={loading}
                >
                  <Text style={styles.submitBtnText}>注 册</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* --- 底部切换区域 --- */}
            <View style={styles.footer}>
              <View style={styles.footerContent}>
                <Text style={styles.footerText}>已经拥有帐户了？</Text>
                <TouchableOpacity
                  style={styles.footerLinkBtn}
                  onPress={() => setSelected('signIn')}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <Text style={styles.footerLinkText}>去登录</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#629BF0" />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAwareScrollView>

          {/* Loading 状态覆盖层 */}
          {loading && <Loading />}
        </SafeAreaView>
      </SafeAreaProvider>
    </KeyboardProvider>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
    justifyContent: 'space-between', // 关键：将 Header、Content、Footer 分开排列
  },
  header: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  cancelText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  mainContent: {
    flex: 1, // 占据剩余空间
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA', // 更现代的浅灰背景
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF3B30',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
    marginRight: -8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 6,
    marginLeft: 4,
  },
  submitBtn: {
    height: 56,
    backgroundColor: '#629BF0',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    // 增加投影增加层次感
    shadowColor: '#629BF0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#A0C4F5',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    alignItems: 'center',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8, // 增加点击区域
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 6,
  },
  footerLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLinkText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#629BF0',
    marginRight: 4,
  },
})
