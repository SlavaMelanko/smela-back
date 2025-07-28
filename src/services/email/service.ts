import type { SupportedLocale } from '@/emails'

import type { EmailPayload, EmailProvider } from './providers'
import type { EmailRegistry } from './registry'
import type { EmailType } from './registry'

export class EmailService {
  constructor(
    private provider: EmailProvider,
    private registry: EmailRegistry,
  ) {}

  async send<T>(
    emailType: EmailType,
    to: string | string[],
    data: T,
    locale?: SupportedLocale,
  ): Promise<void> {
    const config = await this.registry.get<T>(emailType)

    const { email, name } = config.getSender()

    const renderer = await config.getRenderer()
    const { subject, html, text } = await renderer.render(data, locale)

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
