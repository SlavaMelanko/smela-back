import type { UserPreferences } from '@/types'

import type { Metadata } from '../metadata'
import type { EmailRenderer, RenderedEmail } from './email-renderer'

import getContent from '../content'
import { getThemeStyles } from '../styles'
import { UserInvitationEmail } from '../templates'
import { renderEmail } from './helper'

export interface UserInvitationEmailData {
  firstName: string
  inviteUrl: string
  companyName?: string
}

export default class UserInvitationEmailRenderer
implements EmailRenderer<UserInvitationEmailData> {
  async render(
    data: UserInvitationEmailData,
    userPreferences?: UserPreferences,
    metadata?: Metadata,
  ): Promise<RenderedEmail> {
    const content = getContent(userPreferences?.locale).userInvitation
    const styles = getThemeStyles(userPreferences?.theme)

    const subject = content.subject(data.companyName)
    const { html, text } = await renderEmail(
      UserInvitationEmail,
      { data, content, styles, metadata },
    )

    return {
      subject,
      html,
      text,
    }
  }
}
