/** @jsxImportSource react */

import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

import Footer from './components/footer'
import Header from './components/header'
import styles from './styles'

interface WelcomeEmailProps {
  firstName?: string
  verificationUrl?: string
}

// Email-specific styles using the centralized styles
const emailStyles = {
  main: {
    backgroundColor: styles.color.background.primary,
    fontFamily: styles.font.family.sans,
  },
  container: {
    maxWidth: '580px',
    margin: '2rem auto',
    padding: styles.spacing.lg,
    backgroundColor: styles.color.background.secondary,
    borderRadius: styles.borderRadius.lg,
  },
}

export const WelcomeEmail = ({
  firstName,
  verificationUrl,
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to The Company — please verify your email</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Header />

          <Text style={styles.component.text.body}>
            {`Hi ${firstName || 'there'} 👋`}
          </Text>

          <Text style={styles.component.text.body}>
            Welcome aboard! Please verify your email to get started::
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
        </Container>

        <Footer />
      </Body>
    </Html>
  )
}

WelcomeEmail.PreviewProps = {
  firstName: 'Jason',
  verificationUrl: 'http://localhost:3000/verify-email?token=eb6a0c90a8e75d4c9d5a93def2911d7b',
} as WelcomeEmailProps

export default WelcomeEmail
