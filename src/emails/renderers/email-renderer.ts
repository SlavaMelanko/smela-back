import type { SupportedLocale } from '../content'
import type { Metadata } from '../types'

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export interface EmailRenderer<T = any> {
  render: (data: T, locale?: SupportedLocale, metadata?: Metadata) => Promise<RenderedEmail>
}
