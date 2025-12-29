import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons'
import { useTheme } from '@/theme/useTheme'

export default function NetworkError(props) {
  const { theme } = useTheme()
  const title =
    props.title ||
    '🤪唉呀妈呀，网坏了，咋回事呢？' ||
    "🤪Oops! Network error occurred. What's going on?"
  const { onReload } = props
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SimpleLineIcons name={'drawer'} size={160} color={'#ddd'} />
      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity style={styles.reload} onPress={onReload}>
        <Text style={styles.label}>重新加载</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#999',
  },
  reload: {
    marginTop: 10,
    backgroundColor: '#1f99b0',
    height: 40,
    borderRadius: 4,
    paddingLeft: 10,
    paddingRight: 10,
  },
  label: {
    color: '#fff',
    lineHeight: 40,
  },
})
