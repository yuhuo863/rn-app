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
        <FontAwesome
          name="search"
          size={16}
          color={theme.textSecondary}
          style={styles.searchIcon}
        />

        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="搜索标题或用户名..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* 优化：如果有输入内容，显示清除按钮 */}
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        )}

        <View style={[styles.verticalDivider, { backgroundColor: theme.border }]} />

        <TouchableOpacity
          style={[
            styles.filterBtn,
            activeCategory && { backgroundColor: theme.primary + '15' }, // 激活时显示淡色背景
          ]}
          onPress={onOpenFilter}
        >
          <Ionicons
            name="filter"
            size={22}
            color={activeCategory ? theme.primary : theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* 选中分类的 Chip 展示区 */}
      {activeCategory && (
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={onOpenFilter} // 点击 Chip 也能重新选择
          >
            <FontAwesome
              name={activeCat?.icon || 'tag'}
              size={12}
              color={activeCat?.color || theme.textSecondary}
            />
            <Text style={[styles.chipText, { color: theme.text }]}>
              {activeCat?.name || '未知分类'}
            </Text>
            <TouchableOpacity onPress={onClearFilter} hitSlop={10}>
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 6, // 右侧留空给 filter 按钮
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
    marginRight: 4,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 8,
  },
  filterBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 6,
  },
})
