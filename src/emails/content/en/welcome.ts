export interface WelcomeEmailContent {
  subject: string
  previewText: string
  greeting: (firstName?: string) => string
  body: string
  ctaText: string
  disclaimer: string
  signature: {
    thanks: string
    teamName: string
  }
}

export const content: WelcomeEmailContent = {
  subject: 'Welcome to The Company',
  previewText: 'Welcome to The Company — please verify your email',
  greeting: (firstName?: string) => `Hi ${firstName || 'there'} 👋`,
  body: 'Welcome aboard! Please verify your email to get started:',
  ctaText: 'Verify Email Address',
  disclaimer: 'If you didn\'t create an account, you can safely ignore this email.',
  signature: {
    thanks: 'Thanks,',
    teamName: 'The Company Team',
  },
}

export default content
