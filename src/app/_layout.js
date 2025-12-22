import { Stack } from 'expo-router'
import tabOptions from '@/options/tabOptions'
import ModalCloseButton from '@/components/shared/ModalCloseButton'
import { SessionProvider } from '@/utils/ctx'
import { CategoryProvider } from '@/utils/context/CategoryContext'
import { SplashScreenController } from '@/utils/splash'
import { RootSiblingParent } from 'react-native-root-siblings'
import { useColorScheme, View } from 'react-native'

import { lightColors, darkColors } from '@/theme/colors'
import { ThemeContext } from '@/theme/useTheme'

// 根布局组件
export default function Layout() {
  const colorScheme = useColorScheme() // 'light' | 'dark' | null
  const theme = colorScheme === 'dark' ? darkColors : lightColors

  return (
    <ThemeContext.Provider value={theme}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <CategoryProvider>
          <SessionProvider>
            <SplashScreenController />
            <RootSiblingParent>
              <Stack
                screenOptions={{
                  title: '', // 默认标题为空
                  headerTitleAlign: 'center', // 安卓标题栏居中
                  animation: 'slide_from_right', // 安卓使用左右切屏
                  headerTintColor: theme.headerTint, // 导航栏中文字、按钮、图标的颜色
                  // 标题组件的样式
                  headerTitleStyle: {
                    fontWeight: '400',
                    color: theme.headerTint,
                    fontSize: 16,
                  },
                  headerStyle: {
                    backgroundColor: theme.headerBackground,
                  },
                  headerBackButtonDisplayMode: 'minimal', // 设置返回按钮只显示箭头，不显示 "Back"
                }}
              >
                {/* Tabs */}
                <Stack.Screen name="(tabs)" options={tabOptions} />

                {/* Cards */}
                <Stack.Screen name="notices/index" options={{ title: '通知' }} />
                <Stack.Screen name="settings/index" options={{ title: '设置' }} />
                <Stack.Screen name="passwords/[id]" options={{ title: '密码详情' }} />
                <Stack.Screen
                  name="notes/[id]"
                  options={{
                    title: '备注详情',
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                    headerLeft: () => <ModalCloseButton />,
                  }}
                />
              </Stack>
            </RootSiblingParent>
          </SessionProvider>
        </CategoryProvider>
      </View>
    </ThemeContext.Provider>
  )
}
