import { Link } from 'expo-router'
import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useSession } from '@/utils/ctx'
import Loading from '@/components/shared/Loading'

export default function SignUp(props) {
  const { setSelected } = props
  const { signUp } = useSession()
  const [hidePassword, setHidePassword] = useState(true)
  const [formParams, setFormParams] = useState({
    email: '',
    username: '',
    nickname: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)

  /**
   * 表单输入
   * @param text 输入的内容
   * @param name 表单字段名
   */
  const onChangeText = (text, name) => {}

  /**
   * 提交表单
   */
  const handleSubmit = () => {}

  return (
    <View style={styles.container}>
      {loading && <Loading />}

      <View style={styles.content}>
        <Link href="../" asChild>
          <TouchableOpacity>
            <Text style={styles.cancel}>跳过</Text>
          </TouchableOpacity>
        </Link>

        <Text style={styles.title}>会员注册</Text>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>电子邮箱</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input]}
                placeholder="例）name@clwy.cn"
                keyboardType={'email-address'}
                autoCapitalize={'none'}
                autoCorrect={false}
                onChangeText={(text) => onChangeText(text, 'email')}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>用户名</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input]}
                placeholder="英文或数字，5位以上，不能以数字开头"
                autoCapitalize={'none'}
                autoCorrect={false}
                onChangeText={(text) => onChangeText(text, 'username')}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>昵称</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input]}
                placeholder="中文、英文或数字，不含特殊字符"
                keyboardType={'email-address'}
                autoCapitalize={'none'}
                autoCorrect={false}
                onChangeText={(text) => onChangeText(text, 'nickname')}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>密码</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input]}
                placeholder="・・・・・・・・"
                autoCapitalize={'none'}
                autoCorrect={false}
                secureTextEntry={hidePassword}
                onChangeText={(text) => onChangeText(text, 'password')}
              />
              <TouchableWithoutFeedback onPress={() => setHidePassword(!hidePassword)}>
                <View style={styles.eyeIcon}>
                  <MaterialCommunityIcons
                    name={hidePassword ? 'eye-off' : 'eye-outline'}
                    size={24}
                    color={'#333'}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </View>

        <TouchableWithoutFeedback onPress={handleSubmit}>
          <View style={styles.submitWrapper}>
            <Text style={styles.submit}>注册</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>

      <View style={styles.noticeWrapper}>
        <Text style={styles.notice}>已经拥有帐户了？ </Text>
        <MaterialCommunityIcons name={'arrow-right'} size={25} color={'#fff'} />
        <TouchableOpacity onPress={() => setSelected('signIn')}>
          <Text style={styles.noticeLink}>会员登录</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 68,
  },
  cancel: {
    alignSelf: 'flex-end',
    color: '#629BF0',
  },
  title: {
    fontSize: 28,
    marginTop: 28,
  },
  form: {
    marginTop: 29,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    fontSize: 15,
    fontWeight: '300',
    color: '#404044',
    backgroundColor: '#F8F8F8',
    height: 50,
    marginTop: 6,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  inputFocused: {
    borderBottomColor: '#629BF0',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 20,
    backgroundColor: 'transparent',
  },
  inputIcon: {
    position: 'absolute',
    right: 15,
    top: 20,
    color: '#DEDEE2',
  },
  inputIconSuccess: {
    color: '#629BF0',
  },
  forgetPassword: {
    fontSize: 12,
    color: '#629BF0',
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 5,
  },
  submitWrapper: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#629BF0',
    width: 206,
    height: 48,
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  submit: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
    color: '629BF0',
  },
  noticeWrapper: {
    position: 'absolute',
    bottom: 34,
    height: 48,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9DC5F7',
  },
  notice: {
    color: '#fff',
    fontSize: 12,
  },
  noticeLink: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
})
