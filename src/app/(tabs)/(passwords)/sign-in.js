import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import { useTheme } from '@/theme/useTheme'

export default function SignIn() {
  const { theme } = useTheme()
  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <View style={styles.button}>
        <Link href={{ pathname: '/auth' }} asChild>
          <TouchableOpacity>
            <Text style={styles.signIn}>登录</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <Text style={[styles.notice, { color: theme.text }]}>请先登录后再访问</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 32,
    backgroundColor: '#1f99b0',
    borderRadius: 5,
  },
  signIn: {
    color: '#fff',
    textAlign: 'center',
    lineHeight: 40,
    width: 160,
    height: 40,
    fontSize: 16,
  },
  notice: {
    marginTop: 20,
    fontWeight: '300',
    fontSize: 12,
  },
})
