import type { EmailConfig } from './email-config'
import type { EmailType } from './email-type'

export interface EmailRegistry {
  register: <T>(config: EmailConfig<T>) => void
  get: <T>(emailType: EmailType) => Promise<EmailConfig<T>>
}
