import { Resend } from 'resend'

import { exponentialBackoffDelay, sleepFor } from '@/lib/async'
import logger from '@/lib/logger'

import type { EmailPayload } from './payload'
import type { EmailProvider } from './provider'

export class ResendEmailProvider implements EmailProvider {
  private resend: Resend

  constructor(apiKey: string | undefined) {
    if (!apiKey) {
      throw new Error('Email configuration is required.')
    }

    this.resend = new Resend(apiKey)
  }

  async send(payload: EmailPayload): Promise<void> {
    const maxRetries = 2

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const { error } = await this.resend.emails.send({
        from: `${payload.from.name} <${payload.from.email}>`,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      })

      if (!error) {
        if (attempt > 0) {
          logger.info({
            subject: payload.subject,
          }, `Email sent successfully after ${attempt + 1} attempts`)
        }

        return
      }

      if (attempt === maxRetries) {
        logger.error(error, `Failed to send email after ${attempt + 1}/${maxRetries + 1} attempts`, {
          subject: payload.subject,
        })

        return
      }

      logger.warn(error, `Email attempt ${attempt + 1}/${maxRetries + 1} failed, retrying...`, {
        subject: payload.subject,
      })

      await sleepFor(exponentialBackoffDelay(1000, attempt))
    }
  }
}
