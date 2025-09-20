import type { Metadata, UserPreferences } from '@/emails'

import type { EmailType } from './email-type'
import type { EmailPayload, EmailProvider } from './providers'
import type { EmailRegistry } from './registry'

const createMetadata = (): Metadata => ({
  emailId: Bun.randomUUIDv7(),
  sentAt: new Date().toISOString(),
})

const mergeWithDefaultPreferences = (preferences?: UserPreferences): UserPreferences => {
  const defaultPreferences: UserPreferences = { locale: 'en', theme: 'light' }

  return preferences ? { ...defaultPreferences, ...preferences } : defaultPreferences
}

export class EmailService {
  constructor(
    private provider: EmailProvider,
    private registry: EmailRegistry,
  ) {}

  async send<T>(
    emailType: EmailType,
    to: string | string[],
    data: T,
    preferences?: UserPreferences,
  ): Promise<void> {
    const config = await this.registry.get<T>(emailType)

    const { email, name } = config.getSender()

    const renderer = await config.getRenderer()
    const userPreferences = mergeWithDefaultPreferences(preferences)
    const metadata = createMetadata()
    const { subject, html, text } = await renderer.render(data, userPreferences, metadata)

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
