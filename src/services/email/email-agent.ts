import type { UserPreferences } from '@/types'

import env from '@/env'

import { EmailType } from './email-type'
import { createEmailProvider } from './providers'
import { buildEmailRegistry } from './registry'
import { EmailService } from './service'

export class EmailAgent {
  private static instance: EmailAgent | null = null
  private service: EmailService

  private constructor() {
    const provider = createEmailProvider()
    const registry = buildEmailRegistry()

    this.service = new EmailService(provider, registry)
  }

  static getInstance(): EmailAgent {
    if (!EmailAgent.instance) {
      EmailAgent.instance = new EmailAgent()
    }

    return EmailAgent.instance
  }

  async sendEmailVerificationEmail(
    firstName: string,
    email: string,
    token: string,
    preferences?: UserPreferences,
  ) {
    const verificationUrl = `${env.FE_BASE_URL}/verify-email?token=${token}`

    await this.service.send(EmailType.EMAIL_VERIFICATION, email, {
      firstName,
      verificationUrl,
    }, preferences)
  }

  async sendResetPasswordEmail(
    firstName: string,
    email: string,
    token: string,
    preferences?: UserPreferences,
  ) {
    const resetUrl = `${env.FE_BASE_URL}/reset-password?token=${token}`

    await this.service.send(EmailType.PASSWORD_RESET, email, {
      firstName,
      resetUrl,
    }, preferences)
  }
}

const emailAgent = EmailAgent.getInstance()

export { emailAgent }
