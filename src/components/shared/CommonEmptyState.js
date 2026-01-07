import { View, Text, StyleSheet } from 'react-native'
import { SimpleLineIcons } from '@expo/vector-icons'

// 空状态组件
export default function CommonEmptyState() {
  return (
    <View style={styles.notice}>
      <SimpleLineIcons name={'drawer'} size={160} color={'#ddd'} />
      <Text style={styles.noticeMsg}>暂时还没有数据哦~</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  notice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    height: 600,
  },
  noticeMsg: {
    color: '#999',
  },
})
