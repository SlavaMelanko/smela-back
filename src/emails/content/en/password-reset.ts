import type { PasswordResetEmailContent } from '../types'

export const content: PasswordResetEmailContent = {
  subject: 'Reset Your Password',
  previewText: 'Reset your password for The Company account',
  greeting: (firstName?: string) => `Hi ${firstName || 'there'} 👋`,
  body: 'We received a request to reset your password. Click the button below to choose a new password:',
  ctaText: 'Reset Password',
  disclaimer: 'If you didn\'t request a password reset, you can safely ignore this email.',
  expiryNotice: 'This link will expire in 1 hour for security reasons.',
  signature: {
    thanks: 'Thanks,',
    who: 'The Company Team ❤️',
  },
}

export default content
