import type { WelcomeEmailContent } from '../types'

export const content: WelcomeEmailContent = {
  subject: 'Welcome to The Company',
  previewText: 'Welcome to The Company — please verify your email',
  greeting: (firstName?: string) => `Hi ${firstName || 'there'} 👋`,
  body: 'Welcome aboard! Please verify your email to get started:',
  ctaText: 'Verify Email Address',
  disclaimer: 'If you didn\'t create an account, you can safely ignore this email.',
  signature: {
    thanks: 'Thanks,',
    who: 'The Company Team ❤️',
  },
}

export default content
