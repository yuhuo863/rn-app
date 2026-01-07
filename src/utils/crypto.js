import { getRandomBytes } from 'expo-crypto'
import argon2 from 'react-native-argon2'
import { gcm } from '@noble/ciphers/aes.js'
import { Buffer } from 'buffer'
import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { Alert } from 'react-native'

/*
 * Argon2id Native 参数配置
 */
const NATIVE_ARGON2_PARAMS = {
  iterations: 3,
  memory: 65536,
  parallelism: 1,
  hashLength: 32,
  mode: 'argon2id',
}

/**
 * 1. 密钥派生 (Argon2id - Native C++)
 */
export const deriveMasterKey = async (password, uuid, SYSTEM_PEPPER) => {
  if (!password) throw new Error('Password is required')

  try {
    const finalSalt = `${uuid || 'default'}:${SYSTEM_PEPPER}`

    // 调用 Native Argon2
    const result = await argon2(password, finalSalt, NATIVE_ARGON2_PARAMS)

    // Android/Native 可能会返回 { rawHash, encodedHash } 而没有 hex
    // rawHash 通常是 Hex 字符串
    const hexString = result.hex || result.rawHash

    if (!hexString) {
      console.error('❌ Critical: Argon2 result missing hex/rawHash', Object.keys(result))
      throw new Error('Argon2 derivation failed: No result hash found')
    }

    // 统一按 Hex 处理。如果 rawHash 是 Hex 字符串，buffer 转换即正确
    return new Uint8Array(Buffer.from(hexString, 'hex'))
  } catch (e) {
    console.error('❌ Master Key Derivation Failed:', e)
    throw e
  }
}

/**
 * 2. 加密 (AES-256-GCM)
 */
export const encryptField = (text, masterKey) => {
  if (!text || !masterKey) return null
  try {
    const iv = getRandomBytes(12)
    const cipher = gcm(masterKey, iv)
    const plaintext = new TextEncoder().encode(text)
    const encryptedResult = cipher.encrypt(plaintext)
    const tag = encryptedResult.slice(-16)
    const ciphertext = encryptedResult.slice(0, -16)
    return `${Buffer.from(iv).toString('hex')}:${Buffer.from(tag).toString('hex')}:${Buffer.from(ciphertext).toString('hex')}`
  } catch (e) {
    console.error('Encryption failed:', e)
    return null
  }
}

/**
 * 3. 解密
 */
export const decryptField = (encryptedString, masterKey) => {
  if (!encryptedString || !masterKey) return ''
  try {
    const parts = encryptedString.split(':')
    if (parts.length !== 3) return null
    const [ivHex, tagHex, ciphertextHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const ciphertext = Buffer.from(ciphertextHex, 'hex')
    const combined = Buffer.concat([ciphertext, tag])
    const cipher = gcm(masterKey, iv)
    const decrypted = cipher.decrypt(combined)
    return new TextDecoder().decode(decrypted)
  } catch (error) {
    console.error('Decryption failed:', error)
    return null
  }
}

// --- Secure Store ---

const SECURE_STORAGE_KEY = 'user_secure_vault_data'

export const saveSecureData = async (masterKey, systemPepper) => {
  try {
    const dataToStore = {
      masterKey: Buffer.from(masterKey).toString('base64'),
      systemPepper: systemPepper,
    }

    const jsonString = JSON.stringify(dataToStore)

    await SecureStore.setItemAsync(SECURE_STORAGE_KEY, jsonString, {
      requireAuthentication: true, // 注意：如果设备没有设置密码/指纹，这一行在 Android 上会报错
      keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
    })
    // console.log('✅ Secure Data Saved Successfully')
  } catch (error) {
    console.error('❌ SecureStore Save Error:', error)

    // 如果是模拟器或未设密码的真机，回退策略（可选）
    // 或者提示用户设置密码
    Alert.alert(
      '无法启用生物识别',
      '请检查您的设备是否设置了锁屏密码/指纹。在未设置锁屏密码的设备上无法安全存储密钥。\n\n(错误详情: ' +
        error.message +
        ')',
    )
  }
}

export const getSecureDataWithBiometrics = async () => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const isEnrolled = await LocalAuthentication.isEnrolledAsync()

    if (!hasHardware || !isEnrolled) {
      console.log('Bioauth not available')
      return null
    }

    const jsonString = await SecureStore.getItemAsync(SECURE_STORAGE_KEY, {
      requireAuthentication: true,
      authenticationPrompt: '验证身份以恢复密钥环境',
    })

    if (jsonString) {
      const parsedData = JSON.parse(jsonString)
      return {
        masterKey: new Uint8Array(Buffer.from(parsedData.masterKey, 'base64')),
        systemPepper: parsedData.systemPepper,
      }
    }
  } catch (error) {
    if (error?.code !== 'E_SECURESTORE_CANCELLED') {
      console.warn('Biometric retrieval error:', error)
    }
  }
  return null
}

/**
 * 4. 单条数据重加密逻辑
 */
export const reEncryptSingleItem = async (item, oldKey, newKey) => {
  const dTitle = decryptField(item.title, oldKey)
  const dUsername = decryptField(item.username, oldKey)
  const dPassword = decryptField(item.password, oldKey)
  const dNotes = item.notes ? decryptField(item.notes, oldKey) : null
  const dSiteUrl = item.site_url ? decryptField(item.site_url, oldKey) : null

  if (dTitle === null || dPassword === null) {
    throw new Error(`Critical decryption failure for item ID: ${item.id}`)
  }

  return {
    id: item.id,
    title: encryptField(dTitle, newKey),
    username: encryptField(dUsername, newKey),
    password: encryptField(dPassword, newKey),
    notes: dNotes ? encryptField(dNotes, newKey) : null,
    site_url: dSiteUrl ? encryptField(dSiteUrl, newKey) : null,
  }
}

// 辅助函数
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 核心逻辑：重置主密钥并重加密所有数据
 */
export const resetMasterKeyAndReEncrypt = async (
  allItems,
  oldKey,
  newPassword,
  uuid,
  system_pepper,
  onProgress,
) => {
  const newMasterKey = await deriveMasterKey(newPassword, uuid, system_pepper)
  const reEncryptedItems = []
  const total = allItems.length
  const BATCH_SIZE = 10

  for (let i = 0; i < total; i++) {
    const item = allItems[i]
    try {
      const encrypted = await reEncryptSingleItem(item, oldKey, newMasterKey)
      reEncryptedItems.push(encrypted)
    } catch (e) {
      console.error(`Skipping item ${item.id} re-encryption error:`, e)
    }

    if (i % BATCH_SIZE === 0 || i === total - 1) {
      const percent = Math.round(((i + 1) / total) * 100)
      onProgress && onProgress(percent)
      await sleep(0)
    }
  }

  return { reEncryptedItems, newMasterKey }
}
