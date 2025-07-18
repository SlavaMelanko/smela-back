import type { EmailContent, SupportedLocale } from './types'

import * as en from './en'
import * as uk from './uk'

const content: Record<SupportedLocale, EmailContent> = {
  en,
  uk,
}

export const getContent = (locale: SupportedLocale = 'en') => {
  if (locale in content) {
    return content[locale]
  }

  return content.en
}

export type { SupportedLocale }

export default getContent
