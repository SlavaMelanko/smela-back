import type { SupportedLocale } from '../content'
import type { EmailRenderer, RenderedEmail } from './email-renderer'

import getContent from '../content'
import { WelcomeEmail } from '../templates'
import { renderEmail } from './helper'

interface WelcomeEmailData {
  firstName: string
  verificationUrl: string
}

class WelcomeEmailRenderer implements EmailRenderer<WelcomeEmailData> {
  async render(data: WelcomeEmailData, locale?: SupportedLocale): Promise<RenderedEmail> {
    const content = getContent(locale).welcome

    const subject = content.subject
    const { html, text } = await renderEmail(WelcomeEmail, data, content)

    return {
      subject,
      html,
      text,
    }
  }
}

export { WelcomeEmailRenderer as default, type WelcomeEmailData }
