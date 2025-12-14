import { Stack } from 'expo-router'
import tabOptions from '@/options/tabOptions'
import screenOptions from '@/options/screenOptions'
import ModalCloseButton from '@/components/shared/ModalCloseButton'

export default function Layout() {
  return (
    <Stack screenOptions={screenOptions}>
      {/* Tabs */}
      <Stack.Screen name="(tabs)" options={tabOptions} />

      {/* Cards */}
      <Stack.Screen name="notices/index" options={{ title: '通知' }} />
      <Stack.Screen name="settings/index" options={{ title: '设置' }} />
      <Stack.Screen name="search/index" options={{ title: '搜索' }} />
      <Stack.Screen name="passwords/[id]" options={{ title: '密码详情' }} />
      <Stack.Screen
        name="histories/[id]"
        options={{
          title: '密码历史',
          presentation: 'modal', // 以模态弹出方式显示
          animation: 'slide_from_bottom',
          headerLeft: () => <ModalCloseButton />,
        }}
      />
    </Stack>
  )
}
