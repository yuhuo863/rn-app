import { Text, StyleSheet, View, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import useFetchData from '@/hooks/useFetchData'
import Loading from '@/components/shared/Loading'
import NetworkError from '@/components/shared/NetworkError'
import { Link } from 'expo-router'
import EmptyState from '@/components/shared/EmptyState'
import useLoadMore from '@/hooks/useLoadMore'

export default function Index() {
  const { data, setData, loading, error, refreshing, onReload, onRefresh } = useFetchData(
    '/password',
    {
      paranoid: 'true',
    },
  )
  const { onEndReached, LoadMoreFooter } = useLoadMore('/password', 'passwords', setData)
  // const [currentPage, setCurrentPage] = useState(1)

  const renderItem = ({ item, index }) => {
    return (
      <View style={styles.cardList}>
        <Link href={`/passwords/${item.id}?title=${item.title}`} asChild>
          <TouchableOpacity onPress={() => {}}>
            {/*可以在这里进行密码卡片布局, 当前只显示密码标题*/}
            <View
              style={[
                styles.card,
                index % 2 === 0 ? { backgroundColor: '#6f65f4' } : { backgroundColor: '#1f99b0' },
              ]}
            >
              <Text style={styles.title} numberOfLines={1}>
                {item?.title}
              </Text>
            </View>
          </TouchableOpacity>
        </Link>
      </View>
    )
  }

  // const onEndReached = async () => {
  //   const nextPage = currentPage + 1
  //   setCurrentPage(nextPage)
  //   const data = await apiService.get('/password', {
  //     params: {
  //       paranoid: 'true',
  //       currentPage: nextPage,
  //     },
  //   })
  //   setData((prevData) => ({
  //     passwords: [...prevData.passwords, ...data.passwords],
  //   }))
  // }

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
            // 搜索输入框始终可见
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

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>{renderContent()}</SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e29447',
  },
  cardList: {
    marginTop: 13,
    marginLeft: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    width: '45%',
    height: 160,
  },
})
