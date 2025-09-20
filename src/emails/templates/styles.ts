import type { Theme } from '../types'

export const color = {
  light: {
    text: {
      primary: '#141414',
      secondary: '#5c5c5c',
      tertiary: '#a0a0a0',
    },

    background: {
      primary: '#f7f7f7',
      secondary: '#fff',
      tertiary: '#eaeaea',
    },

    border: '#e5e7eb',

    link: '#7678ed',
  },

  dark: {
    text: {
      primary: '#f7f7f7',
      secondary: '#a1a1aa',
      tertiary: '#71717a',
    },

    background: {
      primary: '#141414',
      secondary: '#1e1e1e',
      tertiary: '#2a2a2a',
    },

    border: '#2e2e2e',

    link: '#a5a7ff',
  },
} as const

export const font = {
  family: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },

  size: {
    'xs': '12px',
    'sm': '14px',
    'base': '16px',
    'lg': '18px',
    'xl': '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },

  weight: {
    thin: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const

export const spacing = {
  'xs': '4px',
  'sm': '8px',
  'md': '16px',
  'lg': '24px',
  'xl': '32px',
  '2xl': '48px',
  '3xl': '64px',
  '4xl': '96px',
} as const

export const borderRadius = {
  none: '0',
  sm: '2px',
  md: '4px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const

export const get = (theme: Theme = 'light') => ({
  text: {
    body: {
      fontFamily: font.family.sans,
      fontSize: font.size.base,
      fontWeight: font.weight.normal,
      lineHeight: font.lineHeight.normal,
      color: color[theme].text.primary,
    },
    detail: {
      fontFamily: font.family.sans,
      fontSize: font.size.sm,
      fontWeight: font.weight.normal,
      lineHeight: font.lineHeight.normal,
      color: color[theme].text.tertiary,
    },
    legal: {
      fontFamily: font.family.sans,
      fontSize: font.size.xs,
      fontWeight: font.weight.thin,
      lineHeight: font.lineHeight.normal,
      color: color[theme].text.tertiary,
    },
  },

  link: {
    color: color[theme].link,
    textDecoration: 'underline',
    fontWeight: font.weight.medium,
  },

  icon: {
    width: '24px',
    height: '24px',
    stroke: color[theme].text.tertiary,
    strokeWidth: '1.5',
    fill: 'none',
    transition: 'stroke 0.2s ease-in-out',
    cursor: 'pointer',
  },
})

// Legacy component export for backward compatibility
export const component = get('light')

const styles = {
  color,
  font,
  spacing,
  borderRadius,
  component,
  get,
} as const

export const getThemeStyles = (theme?: Theme) => {
  const t = theme || 'light'

  return { ...styles, ...styles.get(t), color: styles.color[t] }
}

export default styles
