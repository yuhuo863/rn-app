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
export const deriveMasterKey = (password, salt) => {
  try {
    let saltBytes = new TextEncoder().encode(salt)
    if (saltBytes.byteLength < 8) {
      saltBytes = sha256(saltBytes)
    }

    const passwordBytes = new TextEncoder().encode(password)

    return argon2id(passwordBytes, saltBytes, ARGON2_PARAMS)
  } catch (e) {
    console.error('密钥派生异常:', e)
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
export const decryptField = (encryptedString, masterKey) => {
  if (!encryptedString || !masterKey) return ''

  try {
    const parts = encryptedString.split(':')
    if (parts.length !== 3) return '[格式错误]'

    const [ivHex, tagHex, ciphertextHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const ciphertext = Buffer.from(ciphertextHex, 'hex')

    const combined = Buffer.concat([ciphertext, tag])
    const cipher = gcm(masterKey, iv)
    const decrypted = cipher.decrypt(combined)

    return new TextDecoder().decode(decrypted)
  } catch (error) {
    console.error('解密失败:', error)
    return '[解密失败]'
  }
}
