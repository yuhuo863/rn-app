import React from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome } from '@expo/vector-icons'

const SCREEN_WIDTH = Dimensions.get('window').width
const VISUAL_HEIGHT = 120 // 视觉上椭圆的高度
const CIRCLE_SIZE = SCREEN_WIDTH * 1.2 // 圆的实际直径，确保足够大以覆盖屏幕宽度

// 顶部回收站 (完全由 SharedValue 驱动，不触发 React Render) ---
export default function RecycleBin({ globalIsDragging, globalIsOverZone }) {
  // 容器位移动画
  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(globalIsDragging.value ? 0 : -VISUAL_HEIGHT) }],
      opacity: withTiming(globalIsDragging.value ? 1 : 0),
    }
  })

  // 图标放大动画
  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(globalIsOverZone.value ? 1.3 : 1) }],
    }
  })

  // 1. 蓝色层动画：当进入删除区时，蓝色层变透明
  const blueLayerStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(globalIsOverZone.value ? 0 : 1, { duration: 250 }),
    }
  })

  // 2. 红色层动画：进入删除区时，红色层显现
  const redLayerStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(globalIsOverZone.value ? 1 : 0, { duration: 250 }),
    }
  })

  return (
    <Animated.View style={[styles.dropZoneContainer, containerStyle]}>
      {/*
           只使用一个 circleWrapper 作为几何蒙版。
           蓝色和红色渐变作为子元素，通过 absoluteFill 铺满这个圆。
        */}
      <View style={styles.circleWrapper}>
        {/* 1. 底层：蓝色渐变 */}
        <Animated.View style={[StyleSheet.absoluteFill, blueLayerStyle]}>
          <LinearGradient
            colors={[
              '#2563eb', // 顶部：纯正电光蓝 (完全不透明)
              '#3b82f6', // 中间：标准亮蓝 (完全不透明)
              'rgba(59, 130, 246, 0.05)', // 底部：羽化消失
            ]}
            // 0到0.6 之间都是完全不透明的，确保了颜色的“厚度”
            locations={[0, 0.6, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradientFill}
          />
        </Animated.View>

        {/* 2. 顶层：红色渐变 (叠加在蓝色之上，控制 opacity) */}
        <Animated.View style={[StyleSheet.absoluteFill, redLayerStyle]}>
          <LinearGradient
            colors={[
              '#E11D48', // 顶部：浓郁玫瑰红 (确保厚度)
              '#F43F5E', // 中间：明亮正红 (确保鲜艳)
              'rgba(244, 63, 94, 0.05)', // 底部：羽化
            ]}
            locations={[0, 0.6, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradientFill}
          />
        </Animated.View>
      </View>

      {/* 3. 图标层 */}
      <Animated.View style={[styles.iconWrapper, iconStyle]}>
        <FontAwesome name="trash-o" size={28} color="#fff" />
        {/*<Text style={styles.dropText}>松手即删</Text>*/}
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  dropZoneContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: VISUAL_HEIGHT, // 100
    zIndex: 999,
    alignItems: 'center', // 确保图标水平居中
  },
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2, // 完美的圆
    position: 'absolute',
    // 将圆向上提，只露出底部 VISUAL_HEIGHT 的高度
    top: -CIRCLE_SIZE + VISUAL_HEIGHT,
    // 水平居中：(屏幕宽 - 圆宽) / 2
    left: -(CIRCLE_SIZE - SCREEN_WIDTH) / 2,
    overflow: 'hidden',
  },
  absoluteFull: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gradientFill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  iconWrapper: {
    marginTop: 38, // 适配刘海屏位置
    alignItems: 'center',
    justifyContent: 'center',
  },

  dropText: {
    color: 'rgba(255,255,255,0.95)',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
})
