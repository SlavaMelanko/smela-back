import type { EmailRenderer } from '@/emails'

import { EmailType } from '../email-type'
import { BaseEmailConfig } from './config'

export class WelcomeEmailConfig extends BaseEmailConfig {
  constructor() {
    super(EmailType.WELCOME)
  }

  async getRenderer(): Promise<EmailRenderer> {
    const { WelcomeEmailRenderer } = await import('@/emails')

    return new WelcomeEmailRenderer()
  }
}
