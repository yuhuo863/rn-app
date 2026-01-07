import { Link } from 'expo-router'
import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { KeyboardProvider, KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { useSession } from '@/utils/ctx'
import Loading from '@/components/shared/Loading'

export default function SignIn(props) {
  const { setSelected } = props
  const { signIn } = useSession()
  const [hidePassword, setHidePassword] = useState(true)
  const [formParams, setFormParams] = useState({ login: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const onChangeText = (text, name) => {
    setFormParams((prev) => ({ ...prev, [name]: text }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }))
  }

  const validate = () => {
    let valid = true
    let newErrors = {}
    if (!formParams.login) {
      newErrors.login = '请输入用户名或邮箱'
      valid = false
    }
    if (!formParams.password) {
      newErrors.password = '请输入密码'
      valid = false
    }
    setErrors(newErrors)
    return valid
  }

  const handleSubmit = () => {
    Keyboard.dismiss()
    if (!validate()) return

    setLoading(true)
    signIn(formParams, setLoading)
  }

  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        {/* 使用 SafeAreaView 确保不被刘海遮挡 */}
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            bottomOffset={20}
          >
            {/* 顶部操作区 */}
            <View style={styles.header}>
              {/* 这里 Link 应该包裹 View 或 Text，保持点击区域 */}
              <Link href="../" asChild>
                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.cancelText}>跳过</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* 主内容区：使用 Flex 布局垂直居中或顶部排列 */}
            <View style={styles.mainContent}>
              <Text style={styles.title}>欢迎回来</Text>

              <View style={styles.form}>
                {/* 用户名输入 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>账号</Text>
                  <View style={[styles.inputWrapper, errors.login && styles.inputError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="请输入用户名或邮箱"
                      placeholderTextColor="#A0A0A0"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={formParams.login}
                      onChangeText={(text) => onChangeText(text, 'login')}
                    />
                  </View>
                  {errors.login && <Text style={styles.errorText}>{errors.login}</Text>}
                </View>

                {/* 密码输入 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>密码</Text>
                  <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="请输入密码"
                      placeholderTextColor="#A0A0A0"
                      autoCapitalize="none"
                      secureTextEntry={hidePassword}
                      value={formParams.password}
                      onChangeText={(text) => onChangeText(text, 'password')}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setHidePassword(!hidePassword)}
                    >
                      <MaterialCommunityIcons
                        name={hidePassword ? 'eye-off' : 'eye-outline'}
                        size={24}
                        color="#999"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                {/* 登录按钮 */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSubmit}
                  style={styles.submitBtn}
                  disabled={loading}
                >
                  <Text style={styles.submitBtnText}>登 录</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 底部切换区：自然流布局，不需要 absolute */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>新用户请从这里开始</Text>
              <TouchableOpacity style={styles.footerLinkBtn} onPress={() => setSelected('signUp')}>
                <Text style={styles.footerLinkText}>注册账号</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#629BF0" />
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>

          {/* Loading 放在最外层，使用绝对定位覆盖 */}
          {loading && <Loading message="正在构建安全环境..." />}
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
    flexGrow: 1, // 关键：允许内容撑满屏幕，即使内容很少
    paddingHorizontal: 24,
    paddingBottom: 20,
    justifyContent: 'space-between', // 关键：让头部、内容、底部分布
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
  },
  mainContent: {
    flex: 1, // 占据中间剩余空间
    justifyContent: 'center', // 垂直居中
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA', // 浅灰背景，比只有下划线更现代
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF0F0',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
  },
  submitBtn: {
    height: 56,
    backgroundColor: '#629BF0',
    borderRadius: 28, // 全圆角
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#629BF0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
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
    marginRight: 2,
  },
})
