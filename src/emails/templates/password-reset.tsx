/** @jsxImportSource react */

import {
  Link,
  Text,
} from '@react-email/components'

import type { PasswordResetEmailContent } from '../content'
import type { ThemeStyles } from '../styles'
import type { Metadata } from '../types'

import getContent from '../content'
import { getThemeStyles } from '../styles'
import { Signature } from './components'
import BaseEmail from './components/base-email'

interface Props {
  data: {
    firstName: string
    resetUrl: string
  }
  content: PasswordResetEmailContent
  styles: ThemeStyles
  metadata?: Metadata
}

const PasswordResetEmail = ({
  data,
  content: c,
  styles: s,
  metadata,
}: Props) => {
  const { firstName, resetUrl } = data

  return (
    <BaseEmail
      subject={c.subject}
      previewText={c.previewText}
      styles={s}
      metadata={metadata}
    >
      <Text style={s.text.body}>
        {c.greeting(firstName)}
      </Text>

      <Text style={s.text.body}>
        {c.body}
      </Text>

      <Link href={resetUrl} style={s.link}>
        {c.ctaText}
      </Link>

      <Text style={s.text.detail}>
        {`• ${c.expiryNotice}`}
        <br />
        {`• ${c.disclaimer}`}
      </Text>

      <Signature styles={s} signature={c.signature} />
    </BaseEmail>
  )
}

PasswordResetEmail.PreviewProps = {
  data: {
    firstName: 'Jason',
    resetUrl: `http://localhost:5173/reset-password?token=eb6a0c90a8e75d4c9d5a93def2911d7b`,
  },
  content: getContent('en').passwordReset,
  styles: getThemeStyles('light'),
} as Props

export default PasswordResetEmail
