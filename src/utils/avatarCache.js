import * as LegacyFileSystem from 'expo-file-system/legacy'
import { AVATAR_CACHE_DIR } from '@/constants/cache'

/**
 * 下载并缓存用户头像，返回可直接使用的本地 URI
 * @param {string|number} userId 用户唯一 ID
 * @param {string} avatarUrl 网络头像 URL
 * @returns {Promise<string|undefined>} 本地 URI 或 undefined（无头像时）
 */
export const getCachedAvatarUri = async (userId, avatarUrl) => {
  if (!userId || !avatarUrl) {
    return undefined
  }

  try {
    // 确保头像缓存目录存在
    await LegacyFileSystem.makeDirectoryAsync(AVATAR_CACHE_DIR, { intermediates: true })

    // 从 URL 提取文件扩展名（防止参数污染）
    const urlParts = avatarUrl.split('.')
    const ext = urlParts.length > 1 ? urlParts.pop().split('?')[0] : 'jpg'
    const localUri = `${AVATAR_CACHE_DIR}${userId}.${ext}`

    // 如果已经缓存，直接返回本地路径
    const info = await LegacyFileSystem.getInfoAsync(localUri)
    if (info.exists) {
      return localUri
    }

    // 未缓存 → 下载到本地
    const result = await LegacyFileSystem.downloadAsync(avatarUrl, localUri)
    if (result.status === 200) {
      return localUri
    } else {
      console.warn('头像下载失败，status:', result.status)
      return avatarUrl // 下载失败 fallback 到网络 URL
    }
  } catch (error) {
    console.error('头像缓存失败:', error)
    return avatarUrl // 出错也 fallback 到网络 URL
  }
}

/**
 * 清除指定用户的本地头像缓存
 * @param {string|number} userId
 */
export const clearAvatarCache = async (userId) => {
  if (!userId) return

  try {
    // 确保目录存在（避免报错）
    const dirInfo = await LegacyFileSystem.getInfoAsync(AVATAR_CACHE_DIR)
    if (!dirInfo.exists) return

    // 获取缓存目录下的所有文件
    const files = await LegacyFileSystem.readDirectoryAsync(AVATAR_CACHE_DIR)

    // 找到该 userId 开头的文件（忽略后缀差异，如 .jpg 或 .png）并删除
    const userFiles = files.filter((file) => file.startsWith(`${userId}.`))

    for (const file of userFiles) {
      await LegacyFileSystem.deleteAsync(`${AVATAR_CACHE_DIR}${file}`, { idempotent: true })
      console.log('deleted')
    }
  } catch (error) {
    console.error('清除头像缓存失败:', error)
  }
}
