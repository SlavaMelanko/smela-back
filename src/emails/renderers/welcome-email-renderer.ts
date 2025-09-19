import type { SupportedLocale } from '../content'
import type { Metadata } from '../types'
import type { EmailRenderer, RenderedEmail } from './email-renderer'

import getContent from '../content'
import { WelcomeEmail } from '../templates'
import { renderEmail } from './helper'

interface WelcomeEmailData {
  firstName: string
  verificationUrl: string
}

class WelcomeEmailRenderer implements EmailRenderer<WelcomeEmailData> {
  async render(data: WelcomeEmailData, locale?: SupportedLocale, metadata?: Metadata): Promise<RenderedEmail> {
    const content = getContent(locale).welcome

    const subject = content.subject
    const { html, text } = await renderEmail(WelcomeEmail, { data, content, metadata })

    return {
      subject,
      html,
      text,
    }
  }
}

export { WelcomeEmailRenderer as default, type WelcomeEmailData }
