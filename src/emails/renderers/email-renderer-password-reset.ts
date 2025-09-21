import type { Metadata, UserPreferences } from '../types'
import type { EmailRenderer, RenderedEmail } from './email-renderer'

import getContent from '../content'
import { getThemeStyles } from '../styles'
import { PasswordResetEmail } from '../templates'
import { renderEmail } from './helper'

interface PasswordResetEmailData {
  firstName: string
  resetUrl: string
}

class PasswordResetEmailRenderer implements EmailRenderer<PasswordResetEmailData> {
  async render(data: PasswordResetEmailData, userPreferences?: UserPreferences, metadata?: Metadata): Promise<RenderedEmail> {
    const content = getContent(userPreferences?.locale).passwordReset
    const styles = getThemeStyles(userPreferences?.theme)

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
