export const color = {
  text: {
    primary: '#141414',
    secondary: '#5c5c5c',
    tertiary: '#9ca3af',
  },

  background: {
    primary: '#f7f7f7',
    secondary: '#fff',
    tertiary: '#eaeaea',
  },

  border: '#e5e7eb',

  link: '#7678ed',

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

export const shadow = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
} as const

export const component = {
  text: {
    body: {
      fontFamily: font.family.sans,
      fontSize: font.size.base,
      fontWeight: font.weight.normal,
      lineHeight: font.lineHeight.normal,
      color: color.text.primary,
    },
    detail: {
      fontFamily: font.family.sans,
      fontSize: font.size.sm,
      fontWeight: font.weight.normal,
      lineHeight: font.lineHeight.normal,
      color: color.text.tertiary,
    },
    legal: {
      fontFamily: font.family.sans,
      fontSize: font.size.xs,
      fontWeight: font.weight.thin,
      lineHeight: font.lineHeight.normal,
      color: color.text.tertiary,
    },
  },

  link: {
    color: color.link,
    textDecoration: 'underline',
    fontWeight: font.weight.medium,
  },

  icon: {
    width: '24px',
    height: '24px',
    stroke: color.text.tertiary,
    strokeWidth: '1.5',
    fill: 'none',
    transition: 'stroke 0.2s ease-in-out',
    cursor: 'pointer',
  },
} as const

const styles = {
  color,
  font,
  spacing,
  borderRadius,
  shadow,
  component,
} as const

export default styles
