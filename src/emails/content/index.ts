import type { ContentOptions, EmailContent, SupportedLocale } from './types'

import enPasswordReset from './en/password-reset'
import enWelcome from './en/welcome'
import ukPasswordReset from './uk/password-reset'
import ukWelcome from './uk/welcome'

const content: Record<SupportedLocale, EmailContent> = {
  en: {
    welcome: enWelcome,
    passwordReset: enPasswordReset,
  },
  uk: {
    welcome: ukWelcome,
    passwordReset: ukPasswordReset,
  },
}

export const getContent = (options: ContentOptions = {}) => {
  const { locale = 'en' } = options

  if (locale in content) {
    return content[locale]
  }

  return content.en
}

export type { ContentOptions, SupportedLocale }

export default getContent
