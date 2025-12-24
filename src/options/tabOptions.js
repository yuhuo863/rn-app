import { Link } from 'expo-router'
import { Image } from 'expo-image'
import { SimpleLineIcons } from '@expo/vector-icons'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { useTheme } from '@/theme/useTheme'
import { useNotifications } from '@/utils/context/NotificationContext'

/**
 * 导航栏 Logo 组件
 */
function LogoTitle() {
  return <Image style={styles.logo} contentFit="contain" source={require('@/assets/test.png')} />
}

/**
 * 导航栏按钮组件
 * @param props
 */
function HeaderButton(props) {
  const { name, ...rest } = props
  const { theme } = useTheme()
  const { hasUnread } = useNotifications()

  return (
    <Link asChild {...rest}>
      <TouchableOpacity>
        <View>
          <SimpleLineIcons size={20} color={theme.textSecondary} name={name} />
          {hasUnread && name === 'bell' && (
            <View
              style={[
                styles.badge,
                { backgroundColor: theme.primary, borderColor: theme.textSecondary },
              ]}
            />
          )}
        </View>
      </TouchableOpacity>
    </Link>
  )
}

export default function tabOptions() {
  return {
    headerTitleAlign: 'center', // 安卓标题栏居中
    // headerTitle: (props) => <LogoTitle {...props} />,
    headerLeft: () => <HeaderButton name="bell" href="/notices" style={styles.headerButton} />,
    headerRight: () => (
      <>
        <HeaderButton name="options" href="/settings" style={styles.headerButton} />
      </>
    ),
  }
}

const styles = StyleSheet.create({
  logo: {
    width: 135,
    height: 35,
  },
  headerButton: {
    padding: 8,
    position: 'relative', // 使徽章定位相对于按钮
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
})
