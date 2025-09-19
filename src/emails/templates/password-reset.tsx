/** @jsxImportSource react */

import {
  Link,
  Text,
} from '@react-email/components'

import type { PasswordResetEmailContent } from '../content/types'
import type { Metadata } from '../types'

import getContent from '../content'
import { Signature } from './components'
import BaseEmail from './components/base-email'
import styles from './styles'

interface Props {
  data: {
    firstName: string
    resetUrl: string
  }
  content: PasswordResetEmailContent
  metadata?: Metadata
}

const PasswordResetEmail = ({
  data,
  content,
  metadata,
}: Props) => {
  const { component: { text, link } } = styles
  const { firstName, resetUrl } = data
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

      <Link href={resetUrl} style={link}>
        {c.ctaText}
      </Link>

      <Text style={text.detail}>
        {c.expiryNotice}
        <br />
        {c.disclaimer}
      </Text>

      <Signature {...c.signature} />
    </BaseEmail>
  )
}

PasswordResetEmail.PreviewProps = {
  data: {
    firstName: 'Jason',
    resetUrl: `http://localhost:5173/reset-password?token=eb6a0c90a8e75d4c9d5a93def2911d7b`,
  },
  content: getContent('en').passwordReset,
} as Props

export default PasswordResetEmail
