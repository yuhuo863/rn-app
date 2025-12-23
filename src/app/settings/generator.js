import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native'
import { useState } from 'react'
import { Cell, Section } from '@/components/settings/TableView'
import { TableView } from 'clwy-react-native-tableview-simple'
import { useTheme } from '@/theme/useTheme'
import * as Clipboard from 'expo-clipboard'

export default function PasswordGenerator() {
  const { theme } = useTheme()

  const [length, setLength] = useState(16)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(true) // 新增：避免歧义字符

  const [generatedPassword, setGeneratedPassword] = useState('')

  // 基础字符集
  const lowercase = 'abcdefghjkmnpqrstuvwxyz' // 去掉 l o
  const uppercase = 'ABCDEFGHJKMNPQRSTUVWXYZ' // 去掉 I O
  const numbers = '23456789' // 去掉 0 1
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  // 歧义字符（仅在关闭“避免歧义”时才加入）
  const ambiguousLower = 'lo'
  const ambiguousUpper = 'IO'
  const ambiguousNum = '01'

  const generatePassword = () => {
    let charset = ''

    // 小写
    if (includeLowercase) {
      charset += lowercase
      if (!avoidAmbiguous) charset += ambiguousLower
    }

    // 大写
    if (includeUppercase) {
      charset += uppercase
      if (!avoidAmbiguous) charset += ambiguousUpper
    }

    // 数字
    if (includeNumbers) {
      charset += numbers
      if (!avoidAmbiguous) charset += ambiguousNum
    }

    // 符号（符号一般无歧义）
    if (includeSymbols) charset += symbols

    if (charset === '') {
      Alert.alert('提示', '请至少选择一种字符类型')
      return
    }

    let password = ''
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      password += charset[randomIndex]
    }

    setGeneratedPassword(password)
  }

  const copyToClipboard = async () => {
    if (!generatedPassword) return
    await Clipboard.setStringAsync(generatedPassword)
    Alert.alert('已复制', '密码已复制到剪贴板')
  }

  const lengths = [8, 12, 16, 20, 24, 32]

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <TableView>
        {/* 生成的密码 */}
        <Section header="生成的密码">
          <View style={styles.passwordContainer}>
            <Text style={styles.passwordText} selectable>
              {generatedPassword || '点击下方生成密码'}
            </Text>
            {generatedPassword ? (
              <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                <Text style={styles.copyText}>复制</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Section>

        {/* 密码长度 */}
        <Section header="密码长度">
          <View style={styles.lengthGrid}>
            {lengths.map((len) => (
              <TouchableOpacity
                key={len}
                style={[styles.lengthButton, length === len && styles.lengthButtonActive]}
                onPress={() => setLength(len)}
              >
                <Text style={[styles.lengthText, length === len && styles.lengthTextActive]}>
                  {len}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* 字符类型开关 */}
        <Section header="包含字符类型">
          <Cell
            title="大写字母 (A-Z)"
            cellAccessoryView={
              <Switch
                value={includeUppercase}
                onValueChange={setIncludeUppercase}
                trackColor={{ false: '#ccc', true: '#e29447' }}
                thumbColor="#fff"
                ios_backgroundColor="#ccc"
              />
            }
          />
          <Cell
            title="小写字母 (a-z)"
            cellAccessoryView={
              <Switch
                value={includeLowercase}
                onValueChange={setIncludeLowercase}
                trackColor={{ false: '#ccc', true: '#e29447' }}
                thumbColor="#fff"
                ios_backgroundColor="#ccc"
              />
            }
          />
          <Cell
            title="数字 (0-9)"
            cellAccessoryView={
              <Switch
                value={includeNumbers}
                onValueChange={setIncludeNumbers}
                trackColor={{ false: '#ccc', true: '#e29447' }}
                thumbColor="#fff"
                ios_backgroundColor="#ccc"
              />
            }
          />
          <Cell
            title="特殊符号 (!@#等)"
            cellAccessoryView={
              <Switch
                value={includeSymbols}
                onValueChange={setIncludeSymbols}
                trackColor={{ false: '#ccc', true: '#e29447' }}
                thumbColor="#fff"
                ios_backgroundColor="#ccc"
              />
            }
          />
          {/* 新增：避免歧义字符开关 */}
          <Cell
            title="避免歧义字符 (1 l I 0 O 等)"
            cellAccessoryView={
              <Switch
                value={avoidAmbiguous}
                onValueChange={setAvoidAmbiguous}
                trackColor={{ false: '#ccc', true: '#e29447' }}
                thumbColor="#fff"
                ios_backgroundColor="#ccc"
              />
            }
          />
        </Section>

        {/* 生成按钮 */}
        <Section>
          <TouchableOpacity style={styles.generateButton} onPress={generatePassword}>
            <Text style={styles.generateButtonText}>生成新密码</Text>
          </TouchableOpacity>
        </Section>
      </TableView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
  passwordContainer: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    margin: 10,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  passwordText: {
    fontSize: 18,
    fontFamily: 'menlo',
    flex: 1,
    color: '#333',
  },
  copyButton: {
    backgroundColor: '#e29447',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  lengthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'center',
  },
  lengthButton: {
    width: 64,
    height: 44,
    margin: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  lengthButtonActive: {
    backgroundColor: '#e29447',
    borderColor: '#e29447',
  },
  lengthText: {
    fontSize: 16,
    color: '#666',
  },
  lengthTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  generateButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#e29447',
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
})
