import { getRandomBytes } from 'expo-crypto'
import { argon2id } from '@noble/hashes/argon2.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { gcm } from '@noble/ciphers/aes.js'
import { Buffer } from 'buffer'

/*
 * Argon2id 参数配置
 */
const ARGON2_PARAMS = {
  t: 1,
  m: 512, // 降至 512 KiB
  p: 1,
  dkLen: 32,
}

/**
 * 1. 密钥派生 (Argon2id)
 */
export const deriveMasterKey = (password, uuid, SYSTEM_PEPPER) => {
  try {
    // 将唯一的 UUID 与硬编码的 Pepper 拼接，作为最终盐值
    const finalSalt = `${uuid}:${SYSTEM_PEPPER}`

    let saltBytes = new TextEncoder().encode(finalSalt)
    if (saltBytes.byteLength < 8) {
      saltBytes = sha256(saltBytes)
    }

    const passwordBytes = new TextEncoder().encode(password)

    return argon2id(passwordBytes, saltBytes, ARGON2_PARAMS)
  } catch (e) {
    throw e
  }
}

/**
 * 2. 加密 (AES-256-GCM)
 * 格式: "iv:tag:ciphertext"
 */
export const encryptField = (text, masterKey) => {
  if (!text || !masterKey) return null

  const iv = getRandomBytes(12)
  const cipher = gcm(masterKey, iv)
  const plaintext = new TextEncoder().encode(text)

  const encryptedResult = cipher.encrypt(plaintext)

  const tag = encryptedResult.slice(-16)
  const ciphertext = encryptedResult.slice(0, -16)

  return `${Buffer.from(iv).toString('hex')}:${Buffer.from(tag).toString('hex')}:${Buffer.from(ciphertext).toString('hex')}`
}

/**
 * 3. 解密
 */
export const decryptField = async (encryptedString, masterKey) => {
  if (!encryptedString || !masterKey) return ''

  try {
    const parts = encryptedString.split(':')
    if (parts.length !== 3) return '[格式错误]'

    const [ivHex, tagHex, ciphertextHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const ciphertext = Buffer.from(ciphertextHex, 'hex')

    const combined = await Buffer.concat([ciphertext, tag])
    const cipher = gcm(masterKey, iv)
    const decrypted = cipher.decrypt(combined)

    return new TextDecoder().decode(decrypted)
  } catch (error) {
    return '[解密失败]'
  }
}

import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { Alert } from 'react-native'

const SECURE_STORAGE_KEY = 'user_secure_vault_data'
/**
 * 将 masterKey 和 system_pepper 打包存入硬件保险箱
 * @param {Uint8Array} masterKey
 * @param {string} systemPepper
 */
export const saveSecureData = async (masterKey, systemPepper) => {
  try {
    // 1. 构建要存储的对象
    const dataToStore = {
      // masterKey 是 Uint8Array，不能直接 JSON 序列化，需转为 Base64
      masterKey: Buffer.from(masterKey).toString('base64'),
      systemPepper: systemPepper,
    }

    // 2. 序列化为字符串
    const jsonString = JSON.stringify(dataToStore)

    // 3. 存入 SecureStore (SecureStore 只能存字符串)
    await SecureStore.setItemAsync(SECURE_STORAGE_KEY, jsonString, {
      requireAuthentication: true,
      keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
    })
  } catch (error) {
    Alert.alert(
      '安全备份失败',
      '由于您取消了验证或设备不支持，下次打开 App 时需要重新登录才能解密数据。',
    )
  }
}

/**
 * 通过生物识别一次性取回 masterKey 和 system_pepper
 * @returns {Promise<{masterKey: Uint8Array, systemPepper: string} | null>}
 */
export const getSecureDataWithBiometrics = async () => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const isEnrolled = await LocalAuthentication.isEnrolledAsync()

    if (!hasHardware || !isEnrolled) return null

    // 触发生物识别
    const jsonString = await SecureStore.getItemAsync(SECURE_STORAGE_KEY, {
      requireAuthentication: true,
      authenticationPrompt: '验证身份以恢复密钥环境',
    })

    if (jsonString) {
      const parsedData = JSON.parse(jsonString)

      // 恢复 masterKey 为 Uint8Array
      return {
        masterKey: new Uint8Array(Buffer.from(parsedData.masterKey, 'base64')),
        systemPepper: parsedData.systemPepper,
      }
    }
  } catch (error) {
    console.log('生物识别取消或读取失败:', error)
  }
  return null
}

/**
 * 4. 单条数据重加密逻辑
 * 逻辑：用旧钥匙解密 -> 得到明文 -> 用新钥匙加密
 */
export const reEncryptSingleItem = async (item, oldKey, newKey) => {
  // 解密所有敏感字段（旧）
  const title = await decryptField(item.title, oldKey)
  const username = await decryptField(item.username, oldKey)
  const password = await decryptField(item.password, oldKey)
  const notes = item.notes ? await decryptField(item.notes, oldKey) : null
  const site_url = item.site_url ? await decryptField(item.site_url, oldKey) : null

  // 加密所有敏感字段（新）
  return {
    id: item.id, // 保留 ID 供后端识别
    title: encryptField(title, newKey),
    username: encryptField(username, newKey),
    password: encryptField(password, newKey),
    notes: notes ? encryptField(notes, newKey) : null,
    site_url: site_url ? encryptField(site_url, newKey) : null,
  }
}

/**
 * 辅助函数：手动延时
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 核心逻辑：重置主密钥并重加密所有数据
 * @param {Array} allItems 从后端获取的所有加密数据列表
 * @param {Uint8Array} oldKey 当前正在使用的旧密钥
 * @param {string} newPassword 用户设置的新密码
 * @param {string} uuid 用户标识（id）
 * @param {string} system_pepper 用于派生密钥的系统盐值（固定）
 * @param {Function} onProgress 进度回调，用于更新 UI
 */
export const resetMasterKeyAndReEncrypt = async (
  allItems,
  oldKey,
  newPassword,
  uuid,
  system_pepper,
  onProgress,
) => {
  // 1. 派生新密钥
  const newMasterKey = deriveMasterKey(newPassword, uuid, system_pepper)
  const reEncryptedItems = []
  const total = allItems.length
  const BATCH_SIZE = 20 // 即使数据量小，也可以通过小批次保持 UI 极度流畅

  for (let i = 0; i < total; i++) {
    const item = allItems[i]

    // 执行单条重加密
    const encrypted = await reEncryptSingleItem(item, oldKey, newMasterKey)
    reEncryptedItems.push(encrypted)

    // 每处理一定数量或时最后一条，通知 UI 并交还控制权
    if (i % BATCH_SIZE === 0 || i === total - 1) {
      const percent = Math.round(((i + 1) / total) * 100)
      onProgress && onProgress(percent)

      // 核心技巧：通过宏任务队列让出主线程，防止 UI 卡死
      await sleep(0)
    }
  }

  return { reEncryptedItems }
}
