import { View, Text, StyleSheet } from 'react-native'
import { Stack, useLocalSearchParams, useNavigation } from 'expo-router'

export default function Password() {
  const { id, title } = useLocalSearchParams()
  const navigation = useNavigation()
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: title ? `密码详情 - ${title}` : '密码详情' }} />
      <Text style={styles.title}>这里是密码详情页面</Text>

      <Text style={styles.info}>密码ID: {id}</Text>
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
    fontSize: 40,
    fontWeight: 'bold',
    color: '#4f9df7',
  },
  info: {
    marginTop: 20,
    fontSize: 20,
    color: '#67c1b5',
  },
  buttonText: {
    marginTop: 20,
    fontSize: 20,
    color: '#ff7f6f',
  },
})
