import type { SupportedLocale } from '../content'
import type { EmailRenderer, RenderedEmail } from './email-renderer'

import getContent from '../content'
import { PasswordResetEmail } from '../templates'
import { renderEmail } from './helper'

interface PasswordResetEmailData {
  firstName: string
  resetUrl: string
}

class PasswordResetEmailRenderer implements EmailRenderer<PasswordResetEmailData> {
  async render(data: PasswordResetEmailData, locale?: SupportedLocale): Promise<RenderedEmail> {
    const content = getContent(locale).passwordReset

    const subject = content.subject
    const { html, text } = await renderEmail(PasswordResetEmail, data, content)

    return {
      subject,
      html,
      text,
    }
  }
}

export { PasswordResetEmailRenderer as default, type PasswordResetEmailData }
