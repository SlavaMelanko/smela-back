import type { EmailRenderer } from '@/emails'

export enum EmailType {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password-reset',
}

export interface EmailConfig<T = any> {
  emailType: EmailType
  rendererFactory: () => Promise<EmailRenderer<T>>
}

export const emailConfig = {
  welcome: {
    emailType: EmailType.WELCOME,
    rendererFactory: async () => {
      const { WelcomeEmailRenderer } = await import('@/emails')

      return new WelcomeEmailRenderer()
    },
  } as EmailConfig,

  passwordReset: {
    emailType: EmailType.PASSWORD_RESET,
    rendererFactory: async () => {
      const { PasswordResetEmailRenderer } = await import('@/emails')

      return new PasswordResetEmailRenderer()
    },
  } as EmailConfig,
} as const
