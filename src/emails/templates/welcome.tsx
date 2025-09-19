/** @jsxImportSource react */

import {
  Link,
  Text,
} from '@react-email/components'

import type { WelcomeEmailContent } from '../content/types'
import type { Metadata } from '../types'

import getContent from '../content'
import { Signature } from './components'
import BaseEmail from './components/base-email'
import styles from './styles'

interface WelcomeEmailProps {
  data: {
    firstName: string
    verificationUrl: string
  }
  content: WelcomeEmailContent
  metadata?: Metadata
}

const WelcomeEmail = ({
  data,
  content,
  metadata,
}: WelcomeEmailProps) => {
  const { component: { text, link } } = styles
  const { firstName, verificationUrl } = data
  const c = content

  return (
    <BaseEmail
      subject={c.subject}
      previewText={c.previewText}
      metadata={metadata}
    >
      <Text style={text.body}>
        {c.greeting(firstName)}
      </Text>

      <Text style={text.body}>
        {c.body}
      </Text>

      <Link href={verificationUrl} style={link}>
        {c.ctaText}
      </Link>

      <Text style={text.detail}>
        {c.disclaimer}
      </Text>

      <Signature {...c.signature} />
    </BaseEmail>
  )
}

WelcomeEmail.PreviewProps = {
  data: {
    firstName: 'Jason',
    verificationUrl: `http://localhost:5173/auth/verify-email?token=eb6a0c90a8e75d4c9d5a93def2911d7b`,
  },
  content: getContent('en').welcome,
} as WelcomeEmailProps

export default WelcomeEmail
