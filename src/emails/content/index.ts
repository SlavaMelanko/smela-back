import type { ContentOptions, EmailContent, SupportedLocale } from './types'

import enWelcome from './en/welcome'
import ukWelcome from './uk/welcome'

const content: Record<SupportedLocale, EmailContent> = {
  en: {
    welcome: enWelcome,
  },
  uk: {
    welcome: ukWelcome,
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
