import env from '@/lib/env'
import { createEmailProvider, EmailService } from '@/services/email'

class EmailAgent {
  private static instance: EmailAgent | null = null
  private emailService: EmailService

  private constructor() {
    const provider = createEmailProvider('resend')
    this.emailService = new EmailService(provider)
  }

  static getInstance(): EmailAgent {
    if (!EmailAgent.instance) {
      EmailAgent.instance = new EmailAgent()
    }

    return EmailAgent.instance
  }

  async sendWelcomeEmail({
    firstName,
    email,
    token,
  }: {
    firstName: string
    email: string
    token: string
  }) {
    const verificationUrl = `${env.BASE_URL}/auth/verify?token=${token}`

    await this.emailService.sendWelcomeEmail(email, {
      firstName,
      verificationUrl,
    })
  }

  async sendResetPasswordEmail({
    firstName,
    email,
    token,
  }: {
    firstName: string
    email: string
    token: string
  }) {
    const resetUrl = `${env.BASE_URL}/auth/reset-password?token=${token}`

    await this.emailService.sendPasswordResetEmail(email, {
      firstName,
      resetUrl,
    })
  }
}

const emailAgent = EmailAgent.getInstance()

export type { EmailAgent }

export { emailAgent }
