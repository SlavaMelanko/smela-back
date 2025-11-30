import type EmailVerificationContent from '../email-verification'

import { config } from '../../config'

export const content: EmailVerificationContent = {
  subject: 'Verify your email',
  previewText: `Confirm your email for ${config.company.name}`,
  greeting: (firstName?: string) => `Hi ${firstName || 'there'} 👋`,
  body: 'Click the link below to verify your email address:',
  ctaText: 'Verify email address',
  expiryNotice: 'This link will expire in 24 hours for security reasons.',
  disclaimer: 'If you didn\'t create an account, you can safely ignore this email.',
  signature: {
    thanks: 'Thanks,',
    who: `The ${config.company.name} team`,
  },
}

export default content
