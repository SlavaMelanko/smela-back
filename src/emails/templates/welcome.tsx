/** @jsxImportSource react */

import {
  Link,
  Text,
} from '@react-email/components'

import { Signature } from '../components'
import getContent, { type SupportedLocale } from '../content'
import styles from '../styles'
import BaseEmail from './base-email'

interface WelcomeEmailProps {
  firstName?: string
  verificationUrl?: string
  locale?: SupportedLocale
}

export const WelcomeEmail = ({
  firstName,
  verificationUrl,
  locale,
}: WelcomeEmailProps) => {
  const { component: { text, link } } = styles
  const { welcome: c } = getContent({ locale })

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
        <Link href={verificationUrl} style={link.primary}>
          {c.ctaText}
        </Link>
      </Text>

      <Text style={text.muted}>
        {c.disclaimer}
      </Text>

      <Signature {...c.signature} />
    </BaseEmail>
  )
}

WelcomeEmail.PreviewProps = {
  firstName: 'Jason',
  verificationUrl: 'http://localhost:3000/verify-email?token=eb6a0c90a8e75d4c9d5a93def2911d7b',
  locale: 'en',
} as WelcomeEmailProps

export default WelcomeEmail
