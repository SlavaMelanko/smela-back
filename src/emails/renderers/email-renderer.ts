import type { UserPreferences } from '@/types'

import type { Metadata } from '../metadata'

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export interface EmailRenderer<T = any> {
  render: (
    data: T,
    userPreferences?: UserPreferences,
    metadata?: Metadata,
  ) => Promise<RenderedEmail>
}
