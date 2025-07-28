import type { EmailRenderer } from '@/emails'

export interface EmailConfig<T = any> {
  emailType: string
  rendererFactory: () => Promise<EmailRenderer<T>>
}

export const emailConfig = {
  welcome: {
    emailType: 'welcome',
    rendererFactory: async () => {
      const { WelcomeEmailRenderer } = await import('@/emails')

      return new WelcomeEmailRenderer()
    },
  } as EmailConfig,

  passwordReset: {
    emailType: 'password-reset',
    rendererFactory: async () => {
      const { PasswordResetEmailRenderer } = await import('@/emails')

      return new PasswordResetEmailRenderer()
    },
  } as EmailConfig,
} as const
