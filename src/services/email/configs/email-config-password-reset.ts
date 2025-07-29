import type { EmailRenderer } from '@/emails'

import { EmailType } from '../email-type'
import { BaseEmailConfig } from './email-config'

export class PasswordResetEmailConfig extends BaseEmailConfig {
  constructor() {
    super(EmailType.PASSWORD_RESET)
  }

  async getRenderer(): Promise<EmailRenderer> {
    const { PasswordResetEmailRenderer } = await import('@/emails')

    return new PasswordResetEmailRenderer()
  }
}
