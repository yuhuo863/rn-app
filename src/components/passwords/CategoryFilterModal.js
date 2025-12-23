import React from 'react'
import { Modal, TouchableOpacity, View, Text, ScrollView, StyleSheet, Platform } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { useTheme } from '@/theme/useTheme'

export default function CategoryFilterModal({
  visible,
  categories,
  activeCategory,
  onSelect,
  onReset,
  onClose,
}) {
  const { theme } = useTheme()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.bottomSheet, { backgroundColor: theme.background }]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>全部分类</Text>
            <TouchableOpacity onPress={onReset}>
              <Text style={styles.resetText}>重置</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.grid}>
            {categories?.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.item, activeCategory === cat.id && styles.itemActive]}
                onPress={() => onSelect(cat.id)}
              >
                <View
                  style={[
                    [styles.iconBox, { backgroundColor: theme.card }],
                    activeCategory === cat.id && styles.iconBoxActive,
                  ]}
                >
                  <FontAwesome
                    name={cat.icon || 'folder'}
                    size={20}
                    color={activeCategory === cat.id ? '#fff' : cat.color}
                  />
                </View>
                <Text
                  style={[
                    styles.name,
                    { color: theme.textSecondary },
                    activeCategory === cat.id && styles.nameActive,
                  ]}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  resetText: { color: '#3b82f6', fontWeight: '600' },
  scrollArea: { width: '100%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', paddingBottom: 20 },
  item: { width: '25%', alignItems: 'center', marginBottom: 20 },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBoxActive: { backgroundColor: '#3b82f6' },
  name: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  nameActive: { color: '#1e293b', fontWeight: 'bold' },
})
