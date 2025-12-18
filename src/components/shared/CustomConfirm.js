import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated, Pressable } from 'react-native'
import RootSiblings from 'react-native-root-siblings'
import { FontAwesome } from '@expo/vector-icons'

let sibling = null

const ConfirmView = ({ title, message, onConfirm, onCancel, confirmText, cancelText }) => {
  const [fadeAnim] = React.useState(new Animated.Value(0))

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start()
  }, [])

  const close = (callback) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      sibling?.destroy()
      sibling = null
      callback?.()
    })
  }

  return (
    <Pressable style={styles.overlay} onPress={() => close(onCancel)}>
      <Animated.View style={[styles.alertBox, { opacity: fadeAnim }]}>
        <View style={styles.warningIcon}>
          <FontAwesome name="exclamation-circle" size={32} color="#ef4444" />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.btnGroup}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => close(onCancel)}>
            <Text style={styles.cancelBtnText}>{cancelText || '取消'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={() => close(onConfirm)}>
            <Text style={styles.confirmBtnText}>{confirmText || '确定删除'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Pressable>
  )
}

// 暴露给外部调用的函数
export const showConfirm = (options) => {
  if (sibling) return
  sibling = new RootSiblings(
    <ConfirmView
      {...options}
      onConfirm={() => options.onConfirm?.()}
      onCancel={() => options.onCancel?.()}
    />,
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  alertBox: {
    width: '85%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  warningIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  message: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  btnGroup: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#ef4444',
  },
  cancelBtnText: { color: '#64748b', fontWeight: '600' },
  confirmBtnText: { color: '#fff', fontWeight: '600' },
})
