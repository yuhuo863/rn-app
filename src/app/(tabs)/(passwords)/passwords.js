import {
  Text,
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import useFetchData from '@/hooks/useFetchData'
import Loading from '@/components/shared/Loading'
import NetworkError from '@/components/shared/NetworkError'
import { Link } from 'expo-router'
import EmptyState from '@/components/shared/EmptyState'
import useLoadMore from '@/hooks/useLoadMore'
import { FontAwesome } from '@expo/vector-icons'
import { useState } from 'react'
import apiService from '@/utils/request'
import { Picker, PickerIOS } from '@react-native-picker/picker'

export default function Index() {
  const { data, setData, loading, error, refreshing, onReload, onRefresh } = useFetchData(
    '/password',
    {
      paranoid: 'true',
    },
  )
  const { data: categoryMap, loading: cLoading, error: cError } = useFetchData('/category')
  const { onEndReached, LoadMoreFooter } = useLoadMore('/password', 'passwords', setData)
  const [modalVisible, setModalVisible] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)

  const [formParams, setFormParams] = useState({
    title: '',
    username: '',
    encrypted_password: '',
    site_url: undefined,
    notes: undefined,
    categoryId: undefined,
  })
  const onChangeText = (text, name) => {
    setFormParams((prev) => ({
      ...prev,
      [name]: text,
    }))
  }

  const handleSubmit = async () => {
    setLoadingSubmit(true)
    try {
      const res = await apiService.post('/password', formParams)
      setModalVisible(false)
      setLoadingSubmit(false)
      await onReload()
    } catch (error) {
      Alert.alert(
        '错误',
        error.data.errors[0],
        [
          {
            text: 'OK',
            onPress: () => setLoadingSubmit(false),
          },
        ],
        { cancelable: false },
      )
    }
  }

  const renderItem = ({ item, index }) => {
    return (
      <View style={styles.cardList}>
        <Link href={`/passwords/${item.id}?title=${item.title}`} asChild>
          <TouchableOpacity onPress={() => {}}>
            <View style={[styles.card]}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View>
                  <FontAwesome name={item.category.icon} size={25} color="indigo" />
                </View>
                <View>
                  <Text style={styles.title} numberOfLines={1}>
                    {item?.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#d4d' }}>{item.category.name}</Text>
                </View>
              </View>

              <View style={{ marginTop: 24, gap: 16 }}>
                <Text style={{ fontSize: 14, color: '#333' }} numberOfLines={1}>
                  用户名: {item?.username}
                </Text>
                <Text>密码: {item?.password}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Link>
      </View>
    )
  }

  /**
   * 根据数据加载状态，渲染不同的内容
   */
  const renderContent = () => {
    if (loading) {
      return <Loading />
    }
    if (error) {
      return <NetworkError onReload={onReload} />
    }

    return (
      <>
        <FlatList
          data={data.passwords}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          horizontal={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={'#1f99b0'} />
          }
          ListHeaderComponent={
            <Text style={{ fontSize: 14, textAlign: 'center', marginTop: 13 }}>
              密码页头部组件(搜索输入框占位)
            </Text>
          }
          ListFooterComponent={LoadMoreFooter}
          ListEmptyComponent={EmptyState}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.1}
        />
      </>
    )
  }

  const renderCategoryPickerItems = () => {
    if (cLoading) {
      return <Loading />
    }
    if (cError) {
      return <NetworkError onReload={onReload} />
    }
    return categoryMap.categories.map((option) => (
      <Picker.Item label={option.name} value={option.id} />
    ))
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {renderContent()}
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <FontAwesome name="plus" size={30} color="#fff" />
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={() => setModalVisible(true)}
        >
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {loadingSubmit && <Loading />}
            <Text style={{ fontSize: 24, fontWeight: 'bold', margin: 20 }}>添加新密码</Text>
            <Picker
              style={styles.picker}
              mode="dialog"
              onValueChange={(itemValue) => onChangeText(itemValue, 'categoryId')}
              dropdownIconColor={'#1f99b0'}
              dropdownIconRippleColor={'#1f99b0'}
            >
              {renderCategoryPickerItems()}
            </Picker>
            {/*<PickerIOS></PickerIOS>*/}
            <TextInput
              style={styles.input}
              placeholder="请输入密码标题"
              keyboardType={'default'}
              autoCapitalize={'none'}
              autoCorrect={false}
              onChangeText={(text) => onChangeText(text, 'title')}
            />
            <TextInput
              style={[styles.input, { paddingHorizontal: 45 }]}
              placeholder="请输入用户名"
              keyboardType={'default'}
              autoCapitalize={'none'}
              autoCorrect={false}
              onChangeText={(text) => onChangeText(text, 'username')}
            />
            <TextInput
              style={[styles.input, { paddingHorizontal: 55 }]}
              placeholder="请输入密码"
              keyboardType={'default'}
              autoCapitalize={'none'}
              autoCorrect={false}
              secureTextEntry={true}
              onChangeText={(text) => onChangeText(text, 'encrypted_password')}
            />
            <TextInput
              style={[styles.input, { paddingHorizontal: 40 }]}
              placeholder="请输入网站地址"
              keyboardType={'url'}
              autoCapitalize={'none'}
              autoCorrect={false}
              onChangeText={(text) => onChangeText(text, 'site_url')}
            />
            <TextInput
              style={[styles.input, { paddingHorizontal: 55 }]}
              placeholder="请输入备注"
              keyboardType={'default'}
              autoCapitalize={'none'}
              autoCorrect={false}
              onChangeText={(text) => onChangeText(text, 'notes')}
            />
            <View>
              <TouchableOpacity
                style={{
                  backgroundColor: '#1f99b0',
                  paddingVertical: 12,
                  paddingHorizontal: 32,
                  borderRadius: 8,
                  marginTop: 20,
                }}
                onPress={handleSubmit}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>保存密码</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#ccc',
                  paddingVertical: 12,
                  borderRadius: 8,
                  marginTop: 20,
                }}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cardList: {
    marginTop: 15,
    marginLeft: 12,
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    height: 160,
  },
  card: {
    backgroundColor: 'pink',
    alignItems: 'center',
    padding: 10,
    width: 180,
    height: '40%',
    borderTopRightRadius: 5,
    borderTopLeftRadius: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e29447',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // 阴影（安卓）
  },
  input: {
    fontSize: 15,
    color: '#404044',
    backgroundColor: '#F8F8F8',
    height: 50,
    marginTop: 6,
    paddingHorizontal: 35,
    borderBottomWidth: 1,
    marginBottom: 15,
  },
  picker: {
    height: 75,
    width: 150,
    backgroundColor: '#F8F8F8',
    marginBottom: 15,
  },
})
