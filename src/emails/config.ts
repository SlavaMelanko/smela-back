import env from '../lib/env'

interface EmailConfig {
  baseUrl: string
  company: {
    name: string
    social: {
      twitter?: string
      facebook?: string
      linkedin?: string
    }
  }
}

const getEmailConfig = (): EmailConfig => {
  const baseUrl = env.BASE_URL
  const companyName = env.COMPANY_NAME

  return {
    baseUrl,
    company: {
      name: companyName,
      social: {
        twitter: env.COMPANY_TWITTER_URL,
        facebook: env.COMPANY_FACEBOOK_URL,
        linkedin: env.COMPANY_LINKEDIN_URL,
      },
    },
  }
}

export const config = getEmailConfig()
export type { EmailConfig }
