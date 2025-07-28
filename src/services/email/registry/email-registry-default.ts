import type { EmailRenderer } from '@/emails'

import type { EmailConfig } from './email-config'
import type { EmailRegistry } from './email-registry'

export class DefaultEmailRegistry implements EmailRegistry {
  private types = new Map<string, EmailConfig>()

  register<T>(config: EmailConfig<T>): void {
    this.types.set(config.emailType, config)
  }

  async getRenderer<T>(emailType: string): Promise<EmailRenderer<T>> {
    const config = this.types.get(emailType)
    if (!config) {
      throw new Error(`Unknown email type: ${emailType}`)
    }

    return await config.rendererFactory()
  }
}
