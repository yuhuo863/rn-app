import React from 'react'
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native'
import { useTheme } from '@/theme/useTheme'

export default function ThemeActionSheet({ visible, onClose }) {
  const { theme, themeMode, setThemeMode } = useTheme()

  const options = [
    { label: '跟随系统', value: 'system' },
    { label: '浅色模式', value: 'light' },
    { label: '深色模式', value: 'dark' },
  ]

  const handleSelect = (value) => {
    setThemeMode(value)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* 遮罩层 */}
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.flexEnd}>
          {/* 抽屉内容 */}
          <View style={[styles.sheet, { backgroundColor: theme.card || theme.background }]}>
            <View style={styles.header}>
              <Text style={[styles.headerText, { color: theme.text }]}>外观设置</Text>
            </View>

            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.option, { borderBottomColor: theme.border || '#eee' }]}
                onPress={() => handleSelect(opt.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: themeMode === opt.value ? '#007AFF' : theme.text },
                  ]}
                >
                  {opt.label}
                </Text>
                {themeMode === opt.value && <View style={styles.checkDot} />}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: theme.background }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: theme.text }]}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  flexEnd: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  header: { alignItems: 'center', paddingVertical: 15 },
  headerText: { fontSize: 14, opacity: 0.6 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { fontSize: 17, fontWeight: '500' },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    position: 'absolute',
    right: 20,
  },
  cancelBtn: { marginTop: 15, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  cancelText: { fontSize: 17, fontWeight: '600' },
})
