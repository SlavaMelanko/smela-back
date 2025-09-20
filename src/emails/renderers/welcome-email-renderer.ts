import type { Metadata, UserPreferences } from '../types'
import type { EmailRenderer, RenderedEmail } from './email-renderer'

import getContent from '../content'
import { getThemeStyles } from '../styles'
import { WelcomeEmail } from '../templates'
import { renderEmail } from './helper'

interface WelcomeEmailData {
  firstName: string
  verificationUrl: string
}

class WelcomeEmailRenderer implements EmailRenderer<WelcomeEmailData> {
  async render(data: WelcomeEmailData, userPreferences?: UserPreferences, metadata?: Metadata): Promise<RenderedEmail> {
    const content = getContent(userPreferences?.locale).welcome
    const styles = getThemeStyles(userPreferences?.theme)

    const subject = content.subject
    const { html, text } = await renderEmail(WelcomeEmail, { data, content, styles, metadata })

    return {
      subject,
      html,
      text,
    }
  }
}

export { WelcomeEmailRenderer as default, type WelcomeEmailData }
