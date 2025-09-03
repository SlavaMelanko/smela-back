import type { SupportedLocale } from '@/emails'

import type { EmailType } from './email-type'
import type { EmailPayload, EmailProvider } from './providers'
import type { EmailRegistry } from './registry'

const makeMetadata = (): any => ({
  emailId: Bun.randomUUIDv7(),
  sentAt: new Date().toISOString(),
})

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
    const { subject, html, text } = await renderer.render({ ...data, ...makeMetadata() }, locale)

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
