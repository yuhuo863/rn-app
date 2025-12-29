import * as LegacyFileSystem from 'expo-file-system/legacy'
import { APP_CACHE_DIR } from '@/constants/cache'

/**
 * 计算 App 专用缓存目录的大小（返回如 "1.23 MB" 或 "0 MB"）
 */
export const calculateAppCacheSize = async () => {
  try {
    // 先检查目录是否存在，不存在直接返回 0 MB
    const dirInfo = await LegacyFileSystem.getInfoAsync(APP_CACHE_DIR)
    if (!dirInfo.exists) {
      return '0 MB'
    }

    // 递归计算目录总大小
    const getDirSize = async (dirUri) => {
      let total = 0
      try {
        const items = await LegacyFileSystem.readDirectoryAsync(dirUri)
        for (const item of items) {
          const itemUri = `${dirUri}${item}`
          const info = await LegacyFileSystem.getInfoAsync(itemUri)

          if (info.isDirectory) {
            total += await getDirSize(`${itemUri}/`)
          } else if (info.size) {
            total += info.size
          }
        }
      } catch (e) {
        // 如果某个子目录读取失败，忽略，继续计算其他
        return 0 // 直接返回，不影响上层计算
      }
      return total
    }

    const bytes = await getDirSize(APP_CACHE_DIR)
    const mb = bytes === 0 ? '0' : (bytes / (1024 * 1024)).toFixed(2)
    return `${mb} MB`
  } catch (error) {
    return '计算失败'
  }
}

/**
 * 清理 App 专用缓存目录
 */
export const clearAppCache = async () => {
  try {
    await LegacyFileSystem.deleteAsync(APP_CACHE_DIR, { idempotent: true })
    // 重新创建空目录，防止后续操作因目录不存在报错
    await LegacyFileSystem.makeDirectoryAsync(APP_CACHE_DIR, { intermediates: true })
  } catch (error) {
    throw error // 抛出错误让调用方处理 Alert
  }
}
