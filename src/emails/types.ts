export type SupportedLocale = 'en' | 'uk'

export type Theme = 'light' | 'dark'

export interface UserPreferences {
  locale: SupportedLocale
  theme: Theme
}

export interface Metadata {
  emailId?: string
  sentAt?: string
}
