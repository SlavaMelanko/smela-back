import type { Theme } from '../types'

import { get } from './mixins'
import { color } from './themes'
import { borderRadius, font, spacing } from './variables'

const styles = {
  color,
  font,
  spacing,
  borderRadius,
  get,
} as const

export const getThemeStyles = (theme?: Theme) => {
  const t = theme || 'light'

  return { ...styles, ...styles.get(t), color: styles.color[t] }
}

export default styles
