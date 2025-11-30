import type { Theme } from '@/types'

import { color } from './themes'
import { font } from './variables'

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
      fontWeight: font.weight.thin,
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
