import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'

import Loading from '@/components/shared/Loading'

/**
 * 带加载中和进度条的 WebView
 * @param props
 */
export default function ProgressWebView(props) {
  return (
    <View style={styles.container}>
      <WebView {...props} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingBar: {
    backgroundColor: '#1f99b0',
    height: 2,
  },
})
