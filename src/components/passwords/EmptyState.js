import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'

export default function EmptyState({
  filterName,
  filterIcon = 'folder-open-o',
  filterColor = '#cbd5e1',
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconOuter}>
        <View style={styles.iconInner}>
          <FontAwesome name={filterIcon} size={50} color={filterColor} />
        </View>
      </View>
      <Text style={styles.title}>{filterName ? `"${filterName}" 暂无记录` : '这里空空如也'}</Text>
      <Text style={styles.subText}>
        {filterName
          ? `您尚未在 "${filterName}" 分类下存储任何资产`
          : '开始记录您的第一条加密信息吧'}
      </Text>
      <View style={styles.guideBox}>
        <Text style={styles.guideText}>点击下方按钮添加</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  iconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E5EC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  iconInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E0E5EC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#64748b', marginTop: 24 },
  subText: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
  guideBox: {
    marginTop: 40,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  guideText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
})
