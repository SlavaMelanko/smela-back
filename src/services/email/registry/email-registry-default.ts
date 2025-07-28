import type { EmailConfig } from './email-config'
import type { EmailRegistry } from './email-registry'
import type { EmailType } from './email-type'

export class DefaultEmailRegistry implements EmailRegistry {
  private configs = new Map<EmailType, EmailConfig>()

  register<T>(config: EmailConfig<T>): void {
    this.configs.set(config.getType(), config)
  }

  async get<T>(emailType: EmailType): Promise<EmailConfig<T>> {
    const config = this.configs.get(emailType)
    if (!config) {
      throw new Error(`Unknown email type: ${emailType}`)
    }

    return config as EmailConfig<T>
  }
}
