import { Stack } from 'expo-router'
import tabOptions from '@/options/tabOptions'
import ModalCloseButton from '@/components/shared/ModalCloseButton'
import { SessionProvider } from '@/utils/ctx'
import { CategoryProvider } from '@/utils/context/CategoryContext'
import { SplashScreenController } from '@/utils/splash'
import { RootSiblingParent } from 'react-native-root-siblings'
import { ThemeProvider } from '@/utils/theme'
import { useTheme } from '@/theme/useTheme'
import { NotificationProvider } from '@/utils/context/NotificationContext'

function RootLayoutContent() {
  const { theme } = useTheme()
  return (
    <SessionProvider>
      <CategoryProvider>
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
              <Stack.Screen name="notices/index" options={{ title: '通知' }} />
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
              <Stack.Screen name="settings/index" options={{ title: '设置' }} />
              <Stack.Screen name="settings/feedback" options={{ title: '反馈建议' }} />
              <Stack.Screen name="settings/about" options={{ title: '关于App' }} />
              <Stack.Screen name="settings/generator" options={{ title: '密码生成器' }} />
              <Stack.Screen name="profiles/edit" options={{ title: '编辑资料' }} />
              <Stack.Screen name="settings/change-password" options={{ title: '修改密码' }} />
            </Stack>
          </RootSiblingParent>
        </NotificationProvider>
      </CategoryProvider>
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
