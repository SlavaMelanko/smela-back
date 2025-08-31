import env, { isDevEnv } from '@/lib/env'

import type { EmailProvider } from './email-provider'

import { EtherealEmailProvider } from './email-provider-ethereal'
import { ResendEmailProvider } from './email-provider-resend'

export type EmailProviderType = 'resend' | 'ethereal' // | etc.

export const createEmailProvider = (type?: EmailProviderType): EmailProvider => {
  const providerType = type || (isDevEnv() ? 'ethereal' : 'resend')

  switch (providerType) {
    case 'ethereal': {
      return new EtherealEmailProvider(
        env.EMAIL_ETHEREAL_HOST,
        env.EMAIL_ETHEREAL_PORT,
        env.EMAIL_ETHEREAL_USERNAME,
        env.EMAIL_ETHEREAL_PASSWORD,
      )
    }
    case 'resend': {
      return new ResendEmailProvider(env.EMAIL_RESEND_API_KEY)
    }
    default: {
      throw new Error(`Unknown email provider type: ${providerType}`)
    }
  }
}
