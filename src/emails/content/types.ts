export interface WelcomeEmailContent {
  subject: string
  previewText: string
  greeting: (firstName?: string) => string
  body: string
  ctaText: string
  disclaimer: string
  signature: {
    thanks: string
    teamName: string
  }
}

export type SupportedLocale = 'en' | 'uk'

export interface ContentOptions {
  locale?: SupportedLocale
}

export interface EmailContent {
  welcome: WelcomeEmailContent
}
