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

const baseUrl = `http://localhost:3000`

const fontFamily = 'HelveticaNeue,Helvetica,Arial,sans-serif'

const main = {
  backgroundColor: '#ffffff',
  fontFamily,
}

const paragraph = {
  lineHeight: 1.5,
  fontSize: 14,
  color: '#1f2937',
}

const container = {
  maxWidth: '580px',
  margin: '2rem auto',
  backgroundColor: '#f9fafb',
  borderRadius: '0.5rem',
}

const footer = {
  maxWidth: '580px',
  margin: '0 auto',
  color: '#6b7280',
}

const content = {
  padding: '0.5rem 1.5rem 0.5rem 1.5rem',
}

const logo = {
  padding: '1rem',
}

const logoImg = {
  margin: '0 auto',
}

const sectionsBorders = {
  width: '100%',
}

const sectionBorder = {
  borderBottom: '1px solid #e5e7eb',
  width: '249px',
}

const sectionCenter = {
  borderBottom: '1px solid #e66e5a',
  width: '102px',
}

const link = {
  textDecoration: 'underline',
}

export const WelcomeEmail = ({
  firstName,
  verificationUrl,
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Preview>Welcome to The Company – Please verify your email</Preview>
        <Container style={container}>
          <Section style={logo}>
            <Img
              width={100}
              src={`${baseUrl}/static/logo.png`}
              alt="The Company"
              style={logoImg}
            />
          </Section>
          <Section style={sectionsBorders}>
            <Row>
              <Column style={sectionBorder} />
              <Column style={sectionCenter} />
              <Column style={sectionBorder} />
            </Row>
          </Section>
          <Section style={content}>
            <Text style={paragraph}>
              {`Hi ${firstName},`}
            </Text>
            <Text style={paragraph}>
              Welcome aboard! Click below to confirm your email address:
            </Text>
            <Text style={paragraph}>
              👉
              {' '}
              <Link href={verificationUrl} style={link}>
                Verify My Email
              </Link>
            </Text>
            <Text style={paragraph}>
              If the button doesn’t work, copy and paste this link into your browser:
            </Text>
            <Text style={paragraph}>
              {verificationUrl}
            </Text>
            <Text style={paragraph}>
              If you didn’t create an account, you can ignore this email.
            </Text>
            <Text style={paragraph}>
              Thanks,
              <br />
              The Company Team
            </Text>
          </Section>
        </Container>

        <Section style={footer}>
          <Row>
            <Column align="right" style={{ width: '50%', paddingRight: '8px' }}>
              <Img
                src={`${baseUrl}/static/icon-twitter.png`}
                alt="Twitter"
              />
            </Column>
            <Column align="left" style={{ width: '50%', paddingLeft: '8px' }}>
              <Img
                src={`${baseUrl}/static/icon-facebook.png`}
                alt="Facebook"
              />
            </Column>
          </Row>
          <Row>
            <Text style={{ textAlign: 'center', color: '#6b7280' }}>
              © 2025 The Company, All Rights Reserved
              {' '}
              <br />
              123 Main St, Anytown, Ukraine
            </Text>
          </Row>
        </Section>
      </Body>
    </Html>
  )
}

WelcomeEmail.PreviewProps = {
  firstName: 'Jason',
  verificationUrl: 'http://localhost:3000/verify-email?token=123',
} as WelcomeEmailProps

export default WelcomeEmail
