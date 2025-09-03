import env, { isDevEnv } from '@/lib/env'
import logger from '@/lib/logger'

import type { EmailProvider } from './email-provider'

import { EtherealEmailProvider } from './email-provider-ethereal'
import { ResendEmailProvider } from './email-provider-resend'

export type EmailProviderType = 'resend' | 'ethereal' // | etc.

const getProviderType = (type?: EmailProviderType): EmailProviderType => {
  if (type) {
    return type
  }

  const envOverride = env.EMAIL_PROVIDER as EmailProviderType
  if (envOverride) {
    return envOverride
  }

  return isDevEnv() ? 'ethereal' : 'resend'
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
      throw new Error(`Unknown email provider type: ${providerType}`)
    }
  }
}
