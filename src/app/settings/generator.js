import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Platform,
} from 'react-native'
import React, { useState, useCallback, memo } from 'react'
import { Cell, Section } from '@/components/settings/TableView'
import { TableView } from 'clwy-react-native-tableview-simple'
import { useTheme } from '@/theme/useTheme'
import { copyToClipboard } from '@/utils/clipboard'
import * as Crypto from 'expo-crypto'

// --- 性能优化：使用 memo 包装密码显示区，防止滚动时重复渲染 ---
const PasswordDisplay = memo(({ password, theme }) => {
  if (!password) {
    return <Text style={{ color: theme.textSecondary }}>点击下方生成密码</Text>
  }

  return (
    <View style={styles.passwordTextContainer}>
      {password.split('').map((char, index) => {
        let color = theme.text
        if (/[0-9]/.test(char))
          color = '#ff9500' // 数字：橙色
        else if (/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(char))
          color = '#007aff' // 符号：蓝色
        else if (/[A-Z]/.test(char))
          color = '#34c759' // 大写字母：绿色
        else if (/[a-z]/.test(char)) color = '#ff3b30' // 小写字母：红色

        return (
          <Text
            key={`${index}-${char}`}
            style={[
              styles.charText,
              { color, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
            ]}
          >
            {char}
          </Text>
        )
      })}
    </View>
  )
})

export default function PasswordGenerator() {
  const { theme } = useTheme()

  // 基础配置状态
  const [length, setLength] = useState(12)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(true)

  const [generatedPassword, setGeneratedPassword] = useState('')

  // 字符模式
  const handleGenerate = useCallback(() => {
    const lowercaseSafe = 'abcdefghjkmnpqrstuvwxyz'
    const uppercaseSafe = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const numbersSafe = '23456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

    let charset = ''
    if (includeLowercase) charset += lowercaseSafe + (avoidAmbiguous ? '' : 'lo')
    if (includeUppercase) charset += uppercaseSafe + (avoidAmbiguous ? '' : 'IO')
    if (includeNumbers) charset += numbersSafe + (avoidAmbiguous ? '' : '01')
    if (includeSymbols) charset += symbols

    if (!charset) {
      Alert.alert('提示', '请至少选择一种字符类型')
      return
    }

    // --- 使用 expo-crypto 生成加密强随机数 ---
    let password = ''
    // Crypto.getRandomValues 会填充随机字节到数组中
    const randomBytes = Crypto.getRandomValues(new Uint32Array(length))

    for (let i = 0; i < length; i++) {
      // 使用位运算确保索引在 charset 范围内，并获得更好的随机分布
      password += charset.charAt(randomBytes[i] % charset.length)
    }

    setGeneratedPassword(password)
  }, [length, includeLowercase, includeUppercase, includeNumbers, includeSymbols, avoidAmbiguous])

  const onCopy = useCallback(() => {
    if (generatedPassword) {
      copyToClipboard(generatedPassword, '密码', theme)
    }
  }, [generatedPassword, theme])

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      removeClippedSubviews={Platform.OS === 'android'}
    >
      <TableView>
        <Section header="生成结果">
          <View
            style={[styles.passwordBox, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <PasswordDisplay password={generatedPassword} theme={theme} />
            {!!generatedPassword && (
              <TouchableOpacity
                onPress={onCopy}
                style={[styles.copyButton, { backgroundColor: theme.buttonColor }]}
              >
                <Text style={styles.copyText}>复制</Text>
              </TouchableOpacity>
            )}
          </View>
        </Section>

        <Section header="密码长度">
          <View style={styles.lengthGrid}>
            {[8, 12, 16, 20].map((len) => (
              <TouchableOpacity
                key={`len-${len}`}
                style={[
                  styles.lengthButton,
                  { backgroundColor: theme.background, borderColor: theme.border },
                  length === len && {
                    backgroundColor: theme.buttonColor,
                    borderColor: theme.buttonColor,
                  },
                ]}
                onPress={() => setLength(len)}
              >
                <Text style={[styles.lengthText, { color: length === len ? '#fff' : theme.text }]}>
                  {len}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <Section header="字符选项" roundedCorners={false}>
          <View style={{ paddingHorizontal: 15 }}>
            <Cell
              title="包含大写字母 (A-Z)"
              cellAccessoryView={
                <Switch
                  value={includeUppercase}
                  onValueChange={setIncludeUppercase}
                  trackColor={{ true: theme.buttonColor }}
                />
              }
            />
            <Cell
              title="包含小写字母 (a-z)"
              cellAccessoryView={
                <Switch
                  value={includeLowercase}
                  onValueChange={setIncludeLowercase}
                  trackColor={{ true: theme.buttonColor }}
                />
              }
            />
            <Cell
              title="包含数字 (0-9)"
              cellAccessoryView={
                <Switch
                  value={includeNumbers}
                  onValueChange={setIncludeNumbers}
                  trackColor={{ true: theme.buttonColor }}
                />
              }
            />
            <Cell
              title="包含符号 (!@#$)"
              cellAccessoryView={
                <Switch
                  value={includeSymbols}
                  onValueChange={setIncludeSymbols}
                  trackColor={{ true: theme.buttonColor }}
                />
              }
            />
            <Cell
              title="排除歧义字符 (iI1l0Oo)"
              cellAccessoryView={
                <Switch
                  value={avoidAmbiguous}
                  onValueChange={setAvoidAmbiguous}
                  trackColor={{ true: theme.buttonColor }}
                />
              }
            />
          </View>
        </Section>

        <Section>
          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: theme.buttonColor }]}
            onPress={handleGenerate}
          >
            <Text style={styles.generateButtonText}>重新生成</Text>
          </TouchableOpacity>
        </Section>
      </TableView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  passwordBox: {
    margin: 10,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
  },
  passwordTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  charText: {
    fontSize: 20,
    fontWeight: '700',
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  copyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  lengthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    padding: 10,
  },
  lengthButton: {
    width: 55,
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  lengthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  generateButton: {
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
})
