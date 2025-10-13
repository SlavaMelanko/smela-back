import env from '@/env'
import { logger } from '@/logging'

import type { EmailProvider } from './provider'

import { EtherealEmailProvider } from './provider-ethereal'
import { ResendEmailProvider } from './provider-resend'

export type EmailProviderType = 'resend' | 'ethereal' // | etc.

const getProviderType = (type?: EmailProviderType): EmailProviderType => {
  if (type) {
    return type
  }

  // Use resend if API key is provided, otherwise ethereal
  return env.EMAIL_RESEND_API_KEY ? 'resend' : 'ethereal'
}

export const createEmailProvider = (type?: EmailProviderType): EmailProvider => {
  const providerType = getProviderType(type)

  logger.info(`📧 Email provider: ${providerType}`)

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
      throw new Error(`Unknown email provider type: ${providerType as string}`)
    }
  }
}
