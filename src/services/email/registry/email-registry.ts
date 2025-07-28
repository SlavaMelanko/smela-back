import type { EmailRenderer } from '@/emails'

import type { EmailConfig } from './email-config'

export interface EmailRegistry {
  register: <T>(config: EmailConfig<T>) => void
  getRenderer: <T>(emailType: string) => Promise<EmailRenderer<T>>
}
