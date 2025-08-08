/** @jsxImportSource react */

import {
  Link,
  Text,
} from '@react-email/components'

import type { PasswordResetEmailContent } from '../content/types'

import { config } from '../config'
import getContent from '../content'
import BaseEmail from './base-email'
import { Signature } from './components'
import styles from './styles'

interface PasswordResetEmailProps {
  data: {
    firstName: string
    resetUrl: string
  }
  content: PasswordResetEmailContent
}

const PasswordResetEmail = ({
  data,
  content,
}: PasswordResetEmailProps) => {
  const { component: { text, link } } = styles
  const { firstName, resetUrl } = data
  const c = content

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
        <Link href={resetUrl} style={link.primary}>
          {c.ctaText}
        </Link>
      </Text>

      <Text style={text.muted}>
        {c.expiryNotice}
      </Text>

      <Text style={text.muted}>
        {c.disclaimer}
      </Text>

      <Signature signature={c.signature} />
    </BaseEmail>
  )
}

PasswordResetEmail.PreviewProps = {
  data: {
    firstName: 'Jason',
    resetUrl: `${config.frontendUrl}/reset-password?token=eb6a0c90a8e75d4c9d5a93def2911d7b`,
  },
  content: getContent('en').passwordReset,
} as PasswordResetEmailProps

export default PasswordResetEmail
