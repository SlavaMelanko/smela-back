// Email styles constants for consistent theming across all email templates

export const color = {
  primary: '#e66e5a',
  secondary: '#6b7280',
  success: '#22c55e',
  error: '#dc2626',
  warning: '#eab308',
  info: '#3b82f6',

  // Text colors
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    muted: '#9ca3af',
    inverse: '#ffffff',
    highlight: '#be185d',
  },

  // Background colors
  background: {
    primary: '#fff',
    secondary: '#f9fafb',
    muted: '#f3f4f6',
    highlight: '#fce7f3',
    gradientStart: '#ffffff',
    gradientEnd: '#f5f3ff',
    dark: '#1f2937',
  },

  // Border colors
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    hover: '#e9d5ff',
    error: '#dc2626',
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

// Common component styles
export const component = {
  button: {
    primary: {
      backgroundColor: color.primary,
      color: color.text.inverse,
      fontFamily: font.family.sans,
      fontSize: font.size.base,
      fontWeight: font.weight.medium,
      padding: `${spacing.md} ${spacing.lg}`,
      borderRadius: borderRadius.md,
      textDecoration: 'none',
      display: 'inline-block',
      border: 'none',
      cursor: 'pointer',
    },
    secondary: {
      backgroundColor: color.background.secondary,
      color: color.text.primary,
      fontFamily: font.family.sans,
      fontSize: font.size.base,
      fontWeight: font.weight.medium,
      padding: `${spacing.md} ${spacing.lg}`,
      borderRadius: borderRadius.md,
      textDecoration: 'none',
      display: 'inline-block',
      border: `1px solid ${color.border.light}`,
      cursor: 'pointer',
    },
  },

  card: {
    backgroundColor: color.background.primary,
    borderRadius: borderRadius.lg,
    border: `1px solid ${color.border.light}`,
    padding: spacing.lg,
    margin: `${spacing.md} 0`,
  },

  text: {
    heading: {
      fontFamily: font.family.sans,
      fontWeight: font.weight.bold,
      lineHeight: font.lineHeight.tight,
      color: color.text.primary,
      margin: `${spacing.lg} 0 ${spacing.md} 0`,
    },
    body: {
      fontFamily: font.family.sans,
      fontSize: font.size.base,
      lineHeight: font.lineHeight.normal,
      color: color.text.primary,
      margin: `${spacing.md} 0`,
    },
    muted: {
      fontFamily: font.family.sans,
      fontSize: font.size.sm,
      lineHeight: font.lineHeight.normal,
      color: color.text.muted,
      margin: `${spacing.sm} 0`,
    },
  },

  link: {
    primary: {
      color: color.primary,
      textDecoration: 'underline',
      fontWeight: font.weight.medium,
    },
    secondary: {
      color: color.secondary,
      textDecoration: 'underline',
      fontWeight: font.weight.normal,
    },
    muted: {
      color: color.text.muted,
      textDecoration: 'underline',
      fontWeight: font.weight.normal,
    },
  },

  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: spacing.lg,
    fontFamily: font.family.sans,
  },

  divider: {
    border: 'none',
    borderTop: `1px solid ${color.border.light}`,
    margin: `${spacing.lg} 0`,
  },
} as const

// Main styles object - this is what you'll import
const styles = {
  color,
  font,
  spacing,
  borderRadius,
  shadow,
  component,
} as const

export default styles
