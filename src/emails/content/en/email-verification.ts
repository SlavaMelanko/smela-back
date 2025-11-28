import type EmailVerificationContent from '../email-verification'

import { config } from '../../config'

export const content: EmailVerificationContent = {
  subject: `Verify your email for ${config.company.name}`,
  previewText: `Please verify your email to complete registration with ${config.company.name}`,
  greeting: (firstName?: string) => `Hi ${firstName || 'there'} 👋`,
  body: 'Please verify your email to get started:',
  ctaText: 'Verify Email Address',
  disclaimer: 'If you didn\'t create an account, you can safely ignore this email.',
  signature: {
    thanks: 'Thanks,',
    who: `The ${config.company.name} team`,
  },
}

export default content
