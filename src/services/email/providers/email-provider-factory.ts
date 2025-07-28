import env from '@/lib/env'

import type { EmailProvider } from './email-provider'

import { ResendEmailProvider } from './email-provider-resend'

export type EmailProviderType = 'resend'

export const createEmailProvider = (type: EmailProviderType): EmailProvider => {
  switch (type) {
    case 'resend': {
      if (!env.EMAIL_RESEND_API_KEY) {
        throw new Error('EMAIL_RESEND_API_KEY environment variable is required')
      }

      return new ResendEmailProvider(env.EMAIL_RESEND_API_KEY)
    }
    default: {
      throw new Error(`Unknown email provider type: ${type}`)
    }
  }
}
