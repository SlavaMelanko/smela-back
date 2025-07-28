import type { SupportedLocale } from '@/emails'

import type { EmailPayload, EmailProvider } from './providers'
import type { EmailRegistry } from './registry'

import { getSenderProfile } from './sender-profile'

export class EmailService {
  constructor(
    private provider: EmailProvider,
    private registry: EmailRegistry,
  ) {}

  async send<T>(
    to: string | string[],
    emailType: string,
    data: T,
    locale?: SupportedLocale,
  ): Promise<void> {
    const renderer = await this.registry.getRenderer<T>(emailType)
    const { subject, html, text } = await renderer.render(data, locale)
    const { email, name } = getSenderProfile(emailType)

    const payload: EmailPayload = {
      to,
      from: {
        email,
        name,
      },
      subject,
      html,
      text,
    }

    await this.provider.send(payload)
  }
}
