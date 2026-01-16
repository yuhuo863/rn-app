import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native'

export default function ClipboardActionSheet({ visible, onClose, onSelect, currentValue, theme }) {
  const options = [
    { label: '从不', value: 0 },
    { label: '30 秒', value: 30 },
    { label: '60 秒', value: 60 },
    { label: '120 秒', value: 120 },
  ]

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>选择自动清除时间</Text>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, { borderBottomColor: theme.border }]}
              onPress={() => {
                onSelect(opt.value)
                onClose()
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: currentValue === opt.value ? theme.buttonColor : theme.text },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  option: {
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { fontSize: 16, textAlign: 'center' },
})
