/** @jsxImportSource react */

import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'

interface WelcomeEmailProps {
  firstName?: string
  verificationUrl?: string
}

const baseUrl = 'http://localhost:3000'

const styles = {
  main: {
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica, Arial, sans-serif',
  },
  container: {
    maxWidth: '580px',
    margin: '2rem auto',
    padding: '1.5rem',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  paragraph: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#1f2937',
    margin: '12px 0',
  },
  link: {
    textDecoration: 'underline',
    color: '#2563eb',
  },
  footer: {
    textAlign: 'center' as const,
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2rem',
  },
  logo: {
    margin: '0 auto',
    paddingBottom: '1rem',
  },
  social: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  sectionsBorders: {
    width: '100%',
  },
  sectionBorder: {
    borderBottom: '1px solid #e5e7eb',
    width: '254px',
  },
  sectionCenter: {
    borderBottom: '1px solid #e66e5a',
    width: '124px',
  },
  icon: {
    width: '24px',
    height: '24px',
    stroke: '#6b7280',
    strokeWidth: '1.5',
    fill: 'none',
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
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section>
            <Img
              src={`${baseUrl}/static/logo.png`}
              width="100"
              alt="The Company"
              style={styles.logo}
            />
          </Section>
          <Section style={styles.sectionsBorders}>
            <Row>
              <Column style={styles.sectionBorder} />
              <Column style={styles.sectionCenter} />
              <Column style={styles.sectionBorder} />
            </Row>
          </Section>

          <Text style={styles.paragraph}>
            {`Hi ${firstName || 'there'},`}
          </Text>

          <Text style={styles.paragraph}>
            Welcome aboard! Click below to verify your email:
          </Text>

          <Text style={styles.paragraph}>
            👉
            {' '}
            <Link href={verificationUrl} style={styles.link}>
              Verify Email Address
            </Link>
          </Text>

          <Text style={styles.paragraph}>
            Or copy and paste this link into your browser:
            <br />
            <span style={{ color: '#6b7280' }}>{verificationUrl}</span>
          </Text>

          <Text style={styles.paragraph}>
            If you didn’t create an account, you can safely ignore this email.
          </Text>

          <Text style={styles.paragraph}>
            Thanks,
            <br />
            The Company Team
          </Text>
        </Container>

        <Section style={styles.footer}>
          <div style={styles.social}>
            <Link href="https://twitter.com/yourcompany">
              <svg
                style={styles.icon}
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66
               10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0
               20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"
                />
              </svg>
            </Link>

            <Link href="https://facebook.com/yourcompany">
              <svg
                style={styles.icon}
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1
               0 0 1 1-1h3z"
                />
              </svg>
            </Link>
          </div>
          <Text style={styles.footer}>
            © 2025 The Company, All Rights Reserved
            <br />
            123 Main St, Anytown, Ukraine
          </Text>
        </Section>
      </Body>
    </Html>
  )
}

WelcomeEmail.PreviewProps = {
  firstName: 'Jason',
  verificationUrl: 'http://localhost:3000/verify-email?token=eb6a0c90a8e75d4c9d5a93def2911d7b',
} as WelcomeEmailProps

export default WelcomeEmail
