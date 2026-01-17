/** @jsxImportSource react */

import {
  Link,
  Text,
} from '@react-email/components'

import type { UserInvitationContent } from '../content'
import type { Metadata } from '../metadata'
import type { ThemeStyles } from '../styles'

import getContent from '../content'
import { getThemeStyles } from '../styles'
import { Signature } from './components'
import BaseEmail from './components/base-email'

interface Props {
  data: {
    firstName: string
    inviteUrl: string
    companyName?: string
  }
  content: UserInvitationContent
  styles: ThemeStyles
  metadata?: Metadata
}

const UserInvitationEmail = ({
  data,
  content: c,
  styles: s,
  metadata,
}: Props) => {
  const { firstName, inviteUrl, companyName } = data

  return (
    <BaseEmail
      subject={c.subject(companyName)}
      previewText={c.previewText(companyName)}
      styles={s}
      metadata={metadata}
    >
      <Text style={s.text.body}>
        {c.greeting(firstName)}
      </Text>

      <Text style={s.text.body}>
        {c.body(companyName)}
      </Text>

      <Text style={s.text.body}>
        {c.ctaInstruction}
      </Text>

      <Link href={inviteUrl} style={s.link}>
        {c.ctaText}
      </Link>

      <Text style={s.text.detail}>
        {`• ${c.expiryNotice}`}
      </Text>

      <Signature styles={s} signature={c.signature} />
    </BaseEmail>
  )
}

UserInvitationEmail.PreviewProps = {
  data: {
    firstName: 'Jason',
    inviteUrl: `http://localhost:5173/auth/accept-invite?token=eb6a0c90a8e75d4c9d5a93def2911d7b`,
    companyName: 'Acme Inc',
  },
  content: getContent('en').userInvitation,
  styles: getThemeStyles('dark'),
} as Props

export default UserInvitationEmail
