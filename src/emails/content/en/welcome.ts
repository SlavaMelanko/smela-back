import type WelcomeEmailContent from '../welcome'

import { config } from '../../config'

export const content: WelcomeEmailContent = {
  subject: `Welcome to ${config.company.name}`,
  previewText: `Welcome to ${config.company.name} — please verify your email`,
  greeting: (firstName?: string) => `Hi ${firstName || 'there'} 👋`,
  body: 'Welcome aboard! Please verify your email to get started:',
  ctaText: 'Verify Email Address',
  disclaimer: 'If you didn\'t create an account, you can safely ignore this email.',
  signature: {
    thanks: 'Thanks,',
    who: `The ${config.company.name} team`,
  },
}

export default content
