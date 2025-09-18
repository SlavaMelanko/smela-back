import type { EmailRenderer } from '@/emails'

import type { EmailSender } from '../email-sender-profile'
import type { EmailType } from '../email-type'

import { getSenderDetails, SenderProfile } from '../email-sender-profile'

export interface EmailConfig<T = any> {
  getType: () => EmailType
  getRenderer: () => Promise<EmailRenderer<T>>
  getSender: () => EmailSender
}

export abstract class BaseEmailConfig implements EmailConfig {
  protected readonly emailType: EmailType
  protected readonly sender: EmailSender

  constructor(emailType: EmailType, senderProfile: SenderProfile = SenderProfile.SYSTEM) {
    this.emailType = emailType
    this.sender = getSenderDetails(senderProfile)
  }

  getType(): EmailType {
    return this.emailType
  }

  getSender(): EmailSender {
    return this.sender
  }

  abstract getRenderer(): Promise<EmailRenderer>
}
