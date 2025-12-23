import React from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { FontAwesome, Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/theme/useTheme'

export default function SearchAndFilterHeader({
  searchQuery,
  setSearchQuery,
  activeCategory,
  categories,
  onClearFilter,
  onOpenFilter,
}) {
  const { theme } = useTheme()
  const activeCat = categories.find((c) => c.id === activeCategory)

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <View
        style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <FontAwesome name="search" size={16} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={[styles.input, { color: theme.textSecondary }]}
          placeholder="搜索标题或用户名..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={[
            styles.filterBtn,
            { backgroundColor: theme.background, borderColor: theme.border },
            activeCategory && [
              styles.filterBtnActive,
              { backgroundColor: theme.textSecondary, borderColor: theme.textSecondary },
            ],
          ]}
          onPress={onOpenFilter}
        >
          <Ionicons name="filter" size={24} color={activeCategory ? '#fff' : '#64748b'} />
        </TouchableOpacity>
      </View>

      {activeCategory && (
        <View style={styles.chipRow}>
          <View style={styles.chipOuter}>
            <View style={styles.chipInner}>
              <FontAwesome name={activeCat?.icon || 'tag'} size={14} color="#3b82f6" />
              <Text style={styles.chipText}>{activeCat?.name || '已选分类'}</Text>
              <TouchableOpacity onPress={onClearFilter}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { paddingTop: 20, paddingBottom: 10, backgroundColor: '#f8fafc' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    marginHorizontal: 20,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: '#1e293b' },
  filterBtn: {
    width: 46,
    height: 46,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipRow: { flexDirection: 'row', paddingHorizontal: 25, marginTop: 10 },
  chipOuter: {
    backgroundColor: '#E0E5EC',
    borderRadius: 20,
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 4,
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#ffffff',
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  chipText: { fontSize: 13, fontWeight: '800', color: '#444', marginHorizontal: 8 },
})
