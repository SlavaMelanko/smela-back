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
}

// eslint-disable-next-line node/no-process-env
const baseUrl = `https://${process.env.BASE_URL}`

const fontFamily = 'HelveticaNeue,Helvetica,Arial,sans-serif'

const main = {
  backgroundColor: '#efeef1',
  fontFamily,
}

const paragraph = {
  lineHeight: 1.5,
  fontSize: 14,
}

const container = {
  maxWidth: '580px',
  margin: '30px auto',
  backgroundColor: '#ffffff',
  borderRadius: '0.5rem',
}

const footer = {
  maxWidth: '580px',
  margin: '0 auto',
}

const content = {
  padding: '5px 20px 10px 20px',
}

const logo = {
  padding: 30,
}

const logoImg = {
  margin: '0 auto',
}

const sectionsBorders = {
  width: '100%',
}

const sectionBorder = {
  borderBottom: '1px solid rgb(238,238,238)',
  width: '249px',
}

const sectionCenter = {
  borderBottom: '1px solid rgb(145,71,255)',
  width: '102px',
}

const link = {
  textDecoration: 'underline',
}

export const WelcomeEmail = ({
  firstName,
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Preview>Verify your email to continue</Preview>
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
              <Link href="https://www.twitch.tv" style={link}>
                Click here to verify your email address to continue.
              </Link>
            </Text>
            <Text style={paragraph}>
              Or copy and paste this link into your browser if the link doesn't work:
            </Text>
            <Text style={paragraph}>
              https://www.twitch.tv.
            </Text>
            <Text style={paragraph}>
              If you didn’t ask to verify this address, you can ignore this email.
            </Text>
            <Text style={paragraph}>
              Thanks,
              <br />
              The Company Support Team
            </Text>
          </Section>
        </Container>

        <Section style={footer}>
          <Row>
            <Column align="right" style={{ width: '50%', paddingRight: '8px' }}>
              <Img
                src={`${baseUrl}/static/twitch-icon-twitter.png`}
                alt="Twitter"
              />
            </Column>
            <Column align="left" style={{ width: '50%', paddingLeft: '8px' }}>
              <Img
                src={`${baseUrl}/static/twitch-icon-facebook.png`}
                alt="Facebook"
              />
            </Column>
          </Row>
          <Row>
            <Text style={{ textAlign: 'center', color: '#706a7b' }}>
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
} as WelcomeEmailProps

export default WelcomeEmail
