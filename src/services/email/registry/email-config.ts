import type { EmailRenderer } from '@/emails'

import { type EmailSender, getSenderProfile } from './email-sender-profiles'
import { SenderProfile } from './email-sender-profiles'
import { EmailType } from './email-type'

export interface EmailConfig<T = any> {
  getType: () => EmailType
  getRenderer: () => Promise<EmailRenderer<T>>
  getSender: () => EmailSender
}

export class WelcomeEmailConfig implements EmailConfig {
  private readonly emailType = EmailType.WELCOME
  private readonly sender: EmailSender

  constructor() {
    this.sender = getSenderProfile(SenderProfile.SYSTEM)
  }

  getType(): EmailType {
    return this.emailType
  }

  async getRenderer(): Promise<EmailRenderer> {
    const { WelcomeEmailRenderer } = await import('@/emails')

    return new WelcomeEmailRenderer()
  }

  getSender(): EmailSender {
    return this.sender
  }
}

export class PasswordResetEmailConfig implements EmailConfig {
  private readonly emailType = EmailType.PASSWORD_RESET
  private readonly sender: EmailSender

  constructor() {
    this.sender = getSenderProfile(SenderProfile.SYSTEM)
  }

  getType(): EmailType {
    return this.emailType
  }

  async getRenderer(): Promise<EmailRenderer> {
    const { PasswordResetEmailRenderer } = await import('@/emails')

    return new PasswordResetEmailRenderer()
  }

  getSender(): EmailSender {
    return this.sender
  }
}
