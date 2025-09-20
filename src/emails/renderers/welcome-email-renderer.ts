import type { Metadata, UserPreferences } from '../types'
import type { EmailRenderer, RenderedEmail } from './email-renderer'

import getContent from '../content'
import { themeStyles, WelcomeEmail } from '../templates'
import { renderEmail } from './helper'

interface WelcomeEmailData {
  firstName: string
  verificationUrl: string
}

class WelcomeEmailRenderer implements EmailRenderer<WelcomeEmailData> {
  async render(data: WelcomeEmailData, userPreferences?: UserPreferences, metadata?: Metadata): Promise<RenderedEmail> {
    const locale = userPreferences?.locale || 'en'
    const content = getContent(locale).welcome

    const theme = userPreferences?.theme || 'light'
    const styles = { ...themeStyles, ...themeStyles.get(theme), color: themeStyles.color[theme] }

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
