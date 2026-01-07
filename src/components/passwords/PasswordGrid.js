import React from 'react'
import { FlatList, View, StyleSheet, Platform, RefreshControl } from 'react-native'
import DraggablePasswordCard from './DraggablePasswordCard'
import EmptyState from './EmptyState'

export default function PasswordGrid({
  data,
  refreshing,
  onRefresh,
  onDelete,
  filterName,
  filterIcon,
  filterColor,
  globalIsDragging,
  globalIsOverZone,
}) {
  const renderItem = ({ item }) => (
    <View style={styles.cardContainer}>
      <DraggablePasswordCard
        item={item}
        onDelete={onDelete}
        globalIsDragging={globalIsDragging}
        globalIsOverZone={globalIsOverZone}
      />
    </View>
  )

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
      }
      ListEmptyComponent={
        <EmptyState filterName={filterName} filterIcon={filterIcon} filterColor={filterColor} />
      }
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.columnWrapper}
      removeClippedSubviews={Platform.OS === 'android'}
      keyboardShouldPersistTaps="handled"
    />
  )
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 16, flexGrow: 1 },
  columnWrapper: { justifyContent: 'space-between', gap: 12 },
  cardContainer: { flex: 1, marginBottom: 12, maxWidth: '48%' },
})
