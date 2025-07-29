import type { EmailConfig } from '../configs/email-config'
import type { EmailType } from '../email-type'

export interface EmailRegistry {
  add: <T>(config: EmailConfig<T>) => void
  get: <T>(emailType: EmailType) => Promise<EmailConfig<T>>
}
