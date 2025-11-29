import type { UserPreferences } from '@/types'

import type { Metadata } from '../metadata'
import type { EmailRenderer, RenderedEmail } from './email-renderer'

import getContent from '../content'
import { getThemeStyles } from '../styles'
import { EmailVerificationEmail } from '../templates'
import { renderEmail } from './helper'

export interface EmailVerificationEmailData {
  firstName: string
  verificationUrl: string
}

export default class EmailVerificationEmailRenderer
implements EmailRenderer<EmailVerificationEmailData> {
  async render(
    data: EmailVerificationEmailData,
    userPreferences?: UserPreferences,
    metadata?: Metadata,
  ): Promise<RenderedEmail> {
    const content = getContent(userPreferences?.locale).emailVerification
    const styles = getThemeStyles(userPreferences?.theme)

    const subject = content.subject
    const { html, text } = await renderEmail(
      EmailVerificationEmail,
      { data, content, styles, metadata },
    )

    return {
      subject,
      html,
      text,
    }
  }
}
