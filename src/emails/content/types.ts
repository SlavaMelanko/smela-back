export interface WelcomeEmailContent {
  subject: string
  previewText: string
  greeting: (firstName?: string) => string
  body: string
  ctaText: string
  disclaimer: string
  signature: {
    thanks: string
    who: string
  }
}

export interface PasswordResetEmailContent {
  subject: string
  previewText: string
  greeting: (firstName?: string) => string
  body: string
  ctaText: string
  disclaimer: string
  expiryNotice: string
  signature: {
    thanks: string
    who: string
  }
}

export type SupportedLocale = 'en' | 'uk'

export interface EmailContent {
  welcome: WelcomeEmailContent
  passwordReset: PasswordResetEmailContent
}
