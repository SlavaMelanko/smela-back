/** @jsxImportSource react */

import {
  Body,
  Container,
  Head,
  Html,
  Preview,
} from '@react-email/components'

import { Footer, Header } from './components'
import styles from './styles'

export interface BaseEmailProps {
  subject: string
  previewText: string
  children: React.ReactNode
  emailId?: string
  sentAt?: string
}

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

export const BaseEmail = ({
  subject,
  previewText,
  children,
  emailId,
  sentAt,
}: BaseEmailProps) => {
  return (
    <Html>
      <Head>
        <title>{subject}</title>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Header />
          {children}
        </Container>
        <Footer emailId={emailId} sentAt={sentAt} />
      </Body>
    </Html>
  )
}

export default BaseEmail
