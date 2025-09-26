import type { SupportedLocale } from '../types'

import * as en from './en'
import * as uk from './uk'

export type { default as PasswordResetEmailContent } from './password-reset'
export type { default as WelcomeEmailContent } from './welcome'

const content: Record<SupportedLocale, any> = {
  en,
  uk,
}

export const getContent = (locale?: SupportedLocale) => {
  const l = locale || 'en'

  if (l in content) {
    return content[l]
  }

  return content.en
}

export default getContent
