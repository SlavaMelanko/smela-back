import type { EmailConfig } from '../configs/config'
import type { EmailType } from '../email-type'

export interface EmailRegistry {
  add: <T>(config: EmailConfig<T>) => void
  get: <T>(emailType: EmailType) => Promise<EmailConfig<T>>
}
