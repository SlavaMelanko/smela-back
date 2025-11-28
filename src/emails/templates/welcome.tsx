/** @jsxImportSource react */

import {
  Link,
  Text,
} from '@react-email/components'

import type { WelcomeEmailContent } from '../content'
import type { Metadata } from '../metadata'
import type { ThemeStyles } from '../styles'

import getContent from '../content'
import { getThemeStyles } from '../styles'
import { Signature } from './components'
import BaseEmail from './components/base-email'

interface Props {
  data: {
    firstName: string
    verificationUrl: string
  }
  content: WelcomeEmailContent
  styles: ThemeStyles
  metadata?: Metadata
}

const WelcomeEmail = ({
  data,
  content: c,
  styles: s,
  metadata,
}: Props) => {
  const { firstName, verificationUrl } = data

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

      <Link href={verificationUrl} style={s.link}>
        {c.ctaText}
      </Link>

      <Text style={s.text.detail}>
        {`• ${c.disclaimer}`}
      </Text>

      <Signature styles={s} signature={c.signature} />
    </BaseEmail>
  )
}

WelcomeEmail.PreviewProps = {
  data: {
    firstName: 'Jason',
    verificationUrl: `http://localhost:5173/auth/verify-email?token=eb6a0c90a8e75d4c9d5a93def2911d7b`,
  },
  content: getContent('uk').welcome,
  styles: getThemeStyles('dark'),
} as Props

export default WelcomeEmail
