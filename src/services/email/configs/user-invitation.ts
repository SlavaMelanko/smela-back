import type { EmailRenderer } from '@/emails'

import { EmailType } from '../email-type'
import { BaseEmailConfig } from './config'

export class UserInvitationEmailConfig extends BaseEmailConfig {
  constructor() {
    super(EmailType.USER_INVITATION)
  }

  async getRenderer(): Promise<EmailRenderer> {
    const { UserInvitationEmailRenderer } = await import('@/emails')

    return new UserInvitationEmailRenderer()
  }
}
