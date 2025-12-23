import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useColorScheme } from 'react-native'
import { lightColors, darkColors } from '@/theme/colors'
import { ThemeContext } from '@/theme/useTheme'

const THEME_STORAGE_KEY = 'user-theme-preference'

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme()
  const [themeMode, setThemeMode] = useState('system') // 初始状态

  // 1. 加载持久化数据
  useEffect(() => {
    async function loadTheme() {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY)
      if (savedTheme) setThemeMode(savedTheme)
    }
    loadTheme()
  }, [])

  // 2. 持久化保存方法
  const updateTheme = async (newMode) => {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode)
    setThemeMode(newMode)
  }

  // 3. 计算最终渲染的主题颜色
  const currentMode = themeMode === 'system' ? systemColorScheme : themeMode
  const theme = currentMode === 'dark' ? darkColors : lightColors

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
