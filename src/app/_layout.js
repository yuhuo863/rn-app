import { Stack } from 'expo-router'
import tabOptions from '@/options/tabOptions'
import ModalCloseButton from '@/components/shared/ModalCloseButton'
import { SessionProvider } from '@/utils/ctx'
import { SplashScreenController } from '@/utils/splash'
import { RootSiblingParent } from 'react-native-root-siblings'
import { NotificationProvider } from '@/utils/context/NotificationContext'
import { ThemeProvider } from '@/utils/theme'
import { useTheme } from '@/theme/useTheme'

function RootLayoutContent() {
  const { theme } = useTheme()

  return (
    <SessionProvider>
      <NotificationProvider>
        <SplashScreenController />
        <RootSiblingParent>
          <Stack
            screenOptions={{
              title: '',
              headerTitleAlign: 'center',
              animation: 'slide_from_right',
              headerTintColor: theme.headerTint,
              headerTitleStyle: {
                fontWeight: '400',
                color: theme.headerTint,
                fontSize: 16,
              },
              headerStyle: {
                backgroundColor: theme.headerBackground,
              },
              headerBackButtonDisplayMode: 'minimal',
              shadowColor: theme.shadowColor,
            }}
          >
            <Stack.Screen name="(tabs)" options={tabOptions} />
            <Stack.Screen name="notices/index" options={{ title: '通知中心' }} />
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
            <Stack.Screen
              name="notices/[id]"
              options={{
                title: '通知详情',
                presentation: 'modal', // 设置为模态窗口样式，从底部滑入
                animation: 'slide_from_bottom',
                headerLeft: () => <ModalCloseButton />,
              }}
            />
            <Stack.Screen name="settings/index" options={{ title: '设置' }} />
            <Stack.Screen name="settings/feedback" options={{ title: '反馈建议' }} />
            <Stack.Screen name="settings/about" options={{ title: '关于App' }} />
            <Stack.Screen name="settings/generator" options={{ title: '密码生成器' }} />
            <Stack.Screen name="profiles/edit" options={{ title: '编辑资料' }} />
            <Stack.Screen name="settings/change-password" options={{ title: '修改密码' }} />
          </Stack>
        </RootSiblingParent>
      </NotificationProvider>
    </SessionProvider>
  )
}

export default function Layout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  )
}
