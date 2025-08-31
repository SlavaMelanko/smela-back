/** @jsxImportSource react */

import {
  Link,
  Text,
} from '@react-email/components'

import type { WelcomeEmailContent } from '../content/types'

import { config } from '../config'
import getContent from '../content'
import BaseEmail from './base-email'
import { Signature } from './components'
import styles from './styles'

interface WelcomeEmailProps {
  data: {
    firstName: string
    verificationUrl: string
    emailId?: string
    sentAt?: string
  }
  content: WelcomeEmailContent
}

const WelcomeEmail = ({
  data,
  content,
}: WelcomeEmailProps) => {
  const { component: { text, link } } = styles
  const { firstName, verificationUrl, emailId, sentAt } = data
  const c = content

  return (
    <BaseEmail
      subject={c.subject}
      previewText={c.previewText}
      emailId={emailId}
      sentAt={sentAt}
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

      <Signature signature={c.signature} />
    </BaseEmail>
  )
}

WelcomeEmail.PreviewProps = {
  data: {
    firstName: 'Jason',
    verificationUrl: `${config.frontendUrl}/auth/verify-email?token=eb6a0c90a8e75d4c9d5a93def2911d7b`,
  },
  content: getContent('en').welcome,
} as WelcomeEmailProps

export default WelcomeEmail
