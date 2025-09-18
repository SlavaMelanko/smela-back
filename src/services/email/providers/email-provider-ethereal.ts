import type { Transporter } from 'nodemailer'

import nodemailer from 'nodemailer'

import logger from '@/lib/logger'

import type { EmailPayload } from './email-payload'
import type { EmailProvider } from './email-provider'

export class EtherealEmailProvider implements EmailProvider {
  private transporter: Transporter

  constructor(
    host: string | undefined,
    port: number | undefined,
    username: string | undefined,
    password: string | undefined,
  ) {
    if (!host || !port || !username || !password) {
      throw new Error('Ethereal email configuration is required for development.')
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // use TLS
      auth: {
        user: username,
        pass: password,
      },
    })
  }

  async send(payload: EmailPayload): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: `${payload.from.name} <${payload.from.email}>`,
        to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      })

      const previewUrl = nodemailer.getTestMessageUrl(info)

      logger.info({
        msg: 'Ethereal email sent',
        subject: payload.subject,
        messageId: info.messageId,
        previewUrl: previewUrl || 'No preview URL available',
        to: payload.to,
      })
    } catch (error) {
      logger.error({
        msg: 'Failed to send email via Ethereal',
        error: error instanceof Error ? error.message : 'Unknown error',
        to: payload.to,
        subject: payload.subject,
      })
    }
  }
}
