import type { Metadata, UserPreferences } from '../types'
import type { EmailRenderer, RenderedEmail } from './email-renderer'

import getContent from '../content'
import { PasswordResetEmail, themeStyles } from '../templates'
import { renderEmail } from './helper'

interface PasswordResetEmailData {
  firstName: string
  resetUrl: string
}

class PasswordResetEmailRenderer implements EmailRenderer<PasswordResetEmailData> {
  async render(data: PasswordResetEmailData, userPreferences?: UserPreferences, metadata?: Metadata): Promise<RenderedEmail> {
    const locale = userPreferences?.locale || 'en'
    const content = getContent(locale).passwordReset

    const styles = { ...themeStyles, ...themeStyles.get(userPreferences?.theme || 'light') }

    const subject = content.subject
    const { html, text } = await renderEmail(PasswordResetEmail, { data, content, styles, metadata })

    return {
      subject,
      html,
      text,
    }
  }
}

export { PasswordResetEmailRenderer as default, type PasswordResetEmailData }
