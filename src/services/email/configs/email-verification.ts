import type { EmailRenderer } from '@/emails'

import { EmailType } from '../email-type'
import { BaseEmailConfig } from './config'

export class EmailVerificationEmailConfig extends BaseEmailConfig {
  constructor() {
    super(EmailType.EMAIL_VERIFICATION)
  }

  async getRenderer(): Promise<EmailRenderer> {
    const { EmailVerificationEmailRenderer } = await import('@/emails')

    return new EmailVerificationEmailRenderer()
  }
}
