/** @jsxImportSource react */

import {
  Link,
  Text,
} from '@react-email/components'

import content from '../content/en/welcome'
import styles from '../styles'
import BaseEmail from './base-email'

interface WelcomeEmailProps {
  firstName?: string
  verificationUrl?: string
}

export const WelcomeEmail = ({
  firstName,
  verificationUrl,
}: WelcomeEmailProps) => {
  return (
    <BaseEmail
      subject={content.subject}
      previewText={content.previewText}
    >
      <Text style={styles.component.text.body}>
        {content.greeting(firstName)}
      </Text>

      <Text style={styles.component.text.body}>
        {content.body}
      </Text>

      <Text style={styles.component.text.body}>
        <Link href={verificationUrl} style={styles.component.link.primary}>
          {content.ctaText}
        </Link>
      </Text>

      <Text style={styles.component.text.muted}>
        {content.disclaimer}
      </Text>

      <Text style={styles.component.text.body}>
        {content.signature.thanks}
        <br />
        {content.signature.teamName}
      </Text>
    </BaseEmail>
  )
}

WelcomeEmail.PreviewProps = {
  firstName: 'Jason',
  verificationUrl: 'http://localhost:3000/verify-email?token=eb6a0c90a8e75d4c9d5a93def2911d7b',
} as WelcomeEmailProps

export default WelcomeEmail
