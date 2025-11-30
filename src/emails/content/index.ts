import type { SupportedLocale } from '@/types'

import * as en from './en'
import * as uk from './uk'

export type { default as EmailVerificationContent } from './email-verification'
export type { default as PasswordResetEmailContent } from './password-reset'

export type LocaleContent = typeof en

const content: Record<SupportedLocale, LocaleContent> = {
  en,
  uk,
}

export const getContent = (locale?: SupportedLocale): LocaleContent => {
  const l = locale || 'en'

  if (l in content) {
    return content[l]
  }

  return content.en
}

export default getContent
