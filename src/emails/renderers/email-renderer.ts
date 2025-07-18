import type { SupportedLocale } from '../content'

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export interface EmailRenderer<T = any> {
  render: (data: T, locale?: SupportedLocale) => Promise<RenderedEmail>
}
