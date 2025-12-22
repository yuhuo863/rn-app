import React from 'react'
import { TouchableOpacity, View, Text, StyleSheet, Platform, Dimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  withTiming,
} from 'react-native-reanimated'
import { FontAwesome } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'

import { useTheme } from '@/theme/useTheme'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const TRIGGER_THRESHOLD = 180 // 触发状态改变的阈值高度
const DROP_ZONE_HEIGHT = 180 // 触发删除的阈值高度

// 自定义弹簧配置
const springConfig = {
  damping: 20,
  stiffness: 200,
  overshootClamping: false, // 允许轻微过冲
  restDisplacementThreshold: 0.01,
}

const deleteTimingConfig = { duration: 300 }

export default function DraggablePasswordCard({
  item,
  onDelete,
  globalIsDragging,
  globalIsOverZone,
}) {
  const theme = useTheme()
  const router = useRouter()
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const isPressed = useSharedValue(false)

  const pan = Gesture.Pan()
    .minPointers(1) // 至少需要一个手指拖拽
    .maxPointers(1) // 只允许单指拖拽
    .activateAfterLongPress(250)
    .onStart(() => {
      isPressed.value = true
      globalIsDragging.value = 1
      scale.value = withSpring(1.05)
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium)
    })
    .onUpdate((e) => {
      translateX.value = e.translationX
      translateY.value = e.translationY
      const isOver = e.absoluteY < TRIGGER_THRESHOLD ? 1 : 0
      if (globalIsOverZone.value !== isOver) {
        globalIsOverZone.value = isOver
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light)
      }
    })
    .onEnd((e) => {
      const shouldDelete = e.absoluteY < DROP_ZONE_HEIGHT
      if (shouldDelete) {
        translateY.value = withTiming(-SCREEN_HEIGHT / 2, deleteTimingConfig)
        translateX.value = withTiming(0, deleteTimingConfig)
        scale.value = withTiming(0.8, deleteTimingConfig)
        opacity.value = withTiming(0, deleteTimingConfig)

        setTimeout(() => {
          runOnJS(onDelete)(item.id)
        }, deleteTimingConfig.duration + 50)
      }
      if (!shouldDelete) {
        translateX.value = withSpring(0, springConfig)
        translateY.value = withSpring(0, springConfig)
        scale.value = withSpring(1, springConfig)
        opacity.value = withTiming(1)
      }
      globalIsDragging.value = 0
      globalIsOverZone.value = 0
      isPressed.value = false
    })
    .onFinalize(() => {
      globalIsDragging.value = 0
      globalIsOverZone.value = 0
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: isPressed.value ? 9999 : 1,
    opacity: opacity.value,
  }))

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.wrapper, animatedStyle]}>
        <TouchableOpacity
          style={[styles.touchable, { backgroundColor: theme.card }]}
          activeOpacity={0.7}
          onPress={() => router.navigate(`/passwords/${item.id}`)}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: theme.iconContainer }]}>
                <FontAwesome
                  name={item.category?.icon || 'lock'}
                  size={20}
                  color={item.category?.color || '#3b82f6'}
                />
              </View>
              {item.category?.name && (
                <View style={[styles.badge, { backgroundColor: theme.background }]}>
                  <Text style={[styles.badgeText, { color: theme.text }]} numberOfLines={1}>
                    {item.category.name}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                {item.title}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.divider }]} />

            <View style={styles.footer}>
              <View style={styles.infoRow}>
                <FontAwesome name="user" size={12} color="#94a3b8" style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: theme.textSecondary }]} numberOfLines={1}>
                  {item.username || '未设置'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <FontAwesome name="key" size={12} color="#94a3b8" style={styles.infoIcon} />
                <Text style={[styles.passwordMask, { color: theme.primary }]}>•••••••••</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  touchable: {
    borderRadius: 16,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  card: { padding: 16, minHeight: 150 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '50%',
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  titleSection: { flex: 1, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 10 },
  footer: { gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 16, textAlign: 'center', marginRight: 6 },
  infoText: { fontSize: 12, color: '#475569', fontWeight: '500', flex: 1 },
  passwordMask: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: 'bold',
    letterSpacing: 1,
    flex: 1,
    marginTop: 2,
  },
})
