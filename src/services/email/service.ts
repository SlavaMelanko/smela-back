import type { EmailRenderer, SupportedLocale } from '@/emails'

import type { EmailPayload, EmailProvider } from './providers'

import { getSenderProfile } from './sender-profiles'

export class EmailService {
  private emailProvider: EmailProvider

  constructor(emailProvider: EmailProvider) {
    this.emailProvider = emailProvider
  }

  async sendEmail<T>(
    to: string | string[],
    emailType: string,
    renderer: EmailRenderer<T>,
    data: T,
    locale?: SupportedLocale,
  ): Promise<void> {
    const renderedEmail = await renderer.render(data, locale)
    const senderProfile = getSenderProfile(emailType)

    const payload: EmailPayload = {
      to,
      from: {
        email: senderProfile.email,
        name: senderProfile.name,
      },
      subject: renderedEmail.subject,
      html: renderedEmail.html,
      text: renderedEmail.text,
    }

    await this.emailProvider.send(payload)
  }

  async sendWelcomeEmail(
    to: string,
    data: { firstName: string, verificationUrl: string },
    locale?: SupportedLocale,
  ): Promise<void> {
    const { WelcomeEmailRenderer } = await import('@/emails')
    const renderer = new WelcomeEmailRenderer()
    await this.sendEmail(to, 'welcome', renderer, data, locale)
  }

  async sendPasswordResetEmail(
    to: string,
    data: { firstName: string, resetUrl: string },
    locale?: SupportedLocale,
  ): Promise<void> {
    const { PasswordResetEmailRenderer } = await import('@/emails')
    const renderer = new PasswordResetEmailRenderer()
    await this.sendEmail(to, 'password-reset', renderer, data, locale)
  }
}
