import type PasswordResetEmailContent from '../password-reset'

import { config } from '../../config'

export const content: PasswordResetEmailContent = {
  subject: 'Reset Your Password',
  previewText: `Reset your password for ${config.company.name} account`,
  greeting: (firstName?: string) => `Hi ${firstName || 'there'} 👋`,
  body: 'We received a request to reset your password. Click the link below to set a new password:',
  ctaText: 'Reset password',
  expiryNotice: 'This link will expire in 1 hour for security reasons.',
  disclaimer: 'If you didn\'t request a password reset, you can safely ignore this email.',
  signature: {
    thanks: 'Thanks,',
    who: `The ${config.company.name} team`,
  },
}

export default content
