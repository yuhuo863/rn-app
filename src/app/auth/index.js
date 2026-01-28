import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

import SignIn from '@/components/auth/SignIn'
import SignUp from '@/components/auth/SignUp'
import ForgotPassword from '@/components/auth/ForgotPassword'

export default function Auth() {
  const [selected, setSelected] = useState('signIn')

  // 页面映射表
  const screens = {
    signIn: <SignIn setSelected={setSelected} />,
    signUp: <SignUp setSelected={setSelected} />,
    forgotPassword: <ForgotPassword setSelected={setSelected} />,
  }

  return (
    // 1. 全局键盘管理器
    <KeyboardProvider>
      {/* 2. 安全区域提供者 */}
      <SafeAreaProvider>
        {/* 3. 实际的安全区域视图 */}
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            {/* 4. 动画切换逻辑 */}
            {Object.entries(screens).map(
              ([key, component]) =>
                selected === key && (
                  <Animated.View
                    key={key}
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(200)}
                    style={StyleSheet.absoluteFill} // 确保覆盖且不跳动
                  >
                    {component}
                  </Animated.View>
                ),
            )}
          </View>
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
  container: {
    flex: 1,
    position: 'relative', // 为子组件的 absoluteFill 提供锚点
  },
})
