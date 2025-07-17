/** @jsxImportSource react */

import {
  Link,
  Text,
} from '@react-email/components'

import BaseEmail from './base-email'
import styles from './styles'

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
      subject="Welcome to The Company"
      previewText="Welcome to The Company — please verify your email"
    >
      <Text style={styles.component.text.body}>
        {`Hi ${firstName || 'there'} 👋`}
      </Text>

      <Text style={styles.component.text.body}>
        Welcome aboard! Please verify your email to get started:
      </Text>

      <Text style={styles.component.text.body}>
        <Link href={verificationUrl} style={styles.component.link.primary}>
          Verify Email Address
        </Link>
      </Text>

      <Text style={styles.component.text.muted}>
        If you didn't create an account, you can safely ignore this email.
      </Text>

      <Text style={styles.component.text.body}>
        Thanks,
        <br />
        The Company Team
      </Text>
    </BaseEmail>
  )
}

WelcomeEmail.PreviewProps = {
  firstName: 'Jason',
  verificationUrl: 'http://localhost:3000/verify-email?token=eb6a0c90a8e75d4c9d5a93def2911d7b',
} as WelcomeEmailProps

export default WelcomeEmail
