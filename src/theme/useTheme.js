import { createContext, useContext } from 'react'

export const ThemeContext = createContext({
  theme: {}, // 具体颜色对象
  themeMode: 'system', // 'light' | 'dark' | 'system'
  setThemeMode: () => {}, // 切换主题模式的函数
})

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
