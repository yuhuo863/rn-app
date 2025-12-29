import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { Ionicons, FontAwesome } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { useTheme } from '@/theme/useTheme'

export default function LockedOverlay({ isLocked, onUnlock }) {
  const { theme } = useTheme()

  if (!isLocked) return null

  const content = (
    <View style={[styles.overlay, { backgroundColor: theme.background }]}>
      <View style={[styles.lockCircle, { backgroundColor: theme.card }]}>
        <Ionicons name="lock-closed" size={40} color={theme.textSecondary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>密码箱已锁定</Text>
      <Text style={[styles.subText, { color: theme.textSecondary }]}>
        为了您的账户安全，请验证身份
      </Text>
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.card }]} onPress={onUnlock}>
        <Text style={[styles.buttonText, { color: theme.text }]}>验证解锁</Text>
        <FontAwesome name="hand-pointer-o" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  )

  return Platform.OS === 'ios' ? (
    // IOS: 毛玻璃效果
    <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill}>
      {content}
    </BlurView>
  ) : (
    // Android: 纯色背景
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f8fafc' }]}>{content}</View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  lockCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  subText: { fontSize: 14, color: '#64748b', marginBottom: 32 },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
