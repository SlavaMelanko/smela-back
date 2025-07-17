/** @jsxImportSource react */

import {
  Link,
  Text,
} from '@react-email/components'

import { Signature } from '../components'
import getContent, { type SupportedLocale } from '../content'
import styles from '../styles'
import BaseEmail from './base-email'

interface PasswordResetEmailProps {
  firstName?: string
  resetUrl?: string
  locale?: SupportedLocale
}

export const PasswordResetEmail = ({
  firstName,
  resetUrl,
  locale,
}: PasswordResetEmailProps) => {
  const { component: { text, link } } = styles
  const { passwordReset: c } = getContent({ locale })

  return (
    <BaseEmail
      subject={c.subject}
      previewText={c.previewText}
    >
      <Text style={text.body}>
        {c.greeting(firstName)}
      </Text>

      <Text style={text.body}>
        {c.body}
      </Text>

      <Text style={text.body}>
        <Link href={resetUrl} style={link.primary}>
          {c.ctaText}
        </Link>
      </Text>

      <Text style={text.muted}>
        {c.expiryNotice}
      </Text>

      <Text style={text.muted}>
        {c.disclaimer}
      </Text>

      <Signature signature={c.signature} />
    </BaseEmail>
  )
}

PasswordResetEmail.PreviewProps = {
  firstName: 'Jason',
  resetUrl: 'http://localhost:3000/reset-password?token=eb6a0c90a8e75d4c9d5a93def2911d7b',
  locale: 'en',
} as PasswordResetEmailProps

export default PasswordResetEmail
