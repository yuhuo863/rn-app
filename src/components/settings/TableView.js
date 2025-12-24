import { Section as DefaultSection, Cell as DefaultCell } from 'clwy-react-native-tableview-simple'
import { useTheme } from '@/theme/useTheme'

/**
 * 封装 Section
 * @param props
 */
export function Section(props) {
  const { theme } = useTheme()

  return (
    <DefaultSection
      hideSurroundingSeparators={true}
      hideSeparator={true}
      roundedCorners={true}
      sectionPaddingTop={20}
      {...props}
    />
  )
}

/**
 * 封装 Cell
 * @param props
 */
export function Cell(props) {
  const { theme } = useTheme()

  return (
    <DefaultCell
      accessory="DisclosureIndicator"
      titleTextStyle={{ textAlign: 'left', fontSize: 17 }}
      titleTextColor={theme.textSecondary}
      contentContainerStyle={{ height: 55 }}
      backgroundColor={theme.card}
      detail="123"
      {...props}
    />
  )
}
