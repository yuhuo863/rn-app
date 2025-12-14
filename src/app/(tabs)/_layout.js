import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs'
import { Tabs } from 'expo-router'
import { Platform } from 'react-native'
import { SimpleLineIcons } from '@expo/vector-icons'

/**
 * TabBar 图标组件
 * @param props
 */
function TabBarIcon(props) {
  return <SimpleLineIcons size={25} {...props} />
}

export default function TabLayout() {
  // iOS 使用原生液态玻璃 Tabs
  if (Platform.OS === 'ios') {
    return (
      <NativeTabs tintColor="#1f99b0" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger name="passwords">
          <Icon sf={{ default: 'key', selected: 'key.fill' }} />
          <Label>全部</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="index">
          <Label>分类</Label>
          <Icon sf={{ default: 'tag', selected: 'tag.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="trash">
          <Icon sf={{ default: 'trash', selected: 'trash.fill' }} />
          <Label>回收站</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="users">
          <Icon sf={{ default: 'person', selected: 'person.fill' }} />
          <Label>我的</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    )
  }

  // Android 使用传统 JavaScript Tabs
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1f99b0',
      }}
    >
      <Tabs.Screen
        name="passwords"
        options={{
          title: '全部',
          tabBarIcon: ({ color }) => <TabBarIcon name="organization" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: '分类',
          tabBarIcon: ({ color }) => <TabBarIcon name="grid" color={color} />,
        }}
      />
      <Tabs.Screen
        name="trash"
        options={{
          title: '回收站',
          tabBarIcon: ({ color }) => <TabBarIcon name="trash" color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  )
}
