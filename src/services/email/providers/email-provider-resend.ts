import { Resend } from 'resend'

import type { EmailPayload } from './email-payload'
import type { EmailProvider } from './email-provider'

export class ResendEmailProvider implements EmailProvider {
  private resend: Resend

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey)
  }

  async send(payload: EmailPayload): Promise<void> {
    await this.resend.emails.send({
      from: `${payload.from.name} <${payload.from.email}>`,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    })
  }
}
