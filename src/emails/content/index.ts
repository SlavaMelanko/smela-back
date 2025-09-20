import type { SupportedLocale } from '../types'
import type PasswordResetEmailContent from './password-reset'
import type WelcomeEmailContent from './welcome'

import * as en from './en'
import * as uk from './uk'

const content: Record<SupportedLocale, any> = {
  en,
  uk,
}

export const getContent = (locale: SupportedLocale = 'en') => {
  if (locale in content) {
    return content[locale]
  }

  return content.en
}

export type { PasswordResetEmailContent, SupportedLocale, WelcomeEmailContent }

export default getContent
