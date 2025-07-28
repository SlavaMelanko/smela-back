import type { EmailRenderer } from '@/emails'

import type { EmailConfig } from './email-config'
import type { EmailType } from './email-config'

export interface EmailRegistry {
  register: <T>(config: EmailConfig<T>) => void
  getRenderer: <T>(emailType: EmailType) => Promise<EmailRenderer<T>>
}
