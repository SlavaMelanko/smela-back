import env from '../lib/env'

interface EmailConfig {
  baseUrl: string
  company: {
    name: string
    social: Record<string, string>
  }
}

const getEmailConfig = (): EmailConfig => {
  const baseUrl = env.BASE_URL
  const companyName = env.COMPANY_NAME

  return {
    baseUrl,
    company: {
      name: companyName,
      social: env.COMPANY_SOCIAL_LINKS,
    },
  }
}

export const config = getEmailConfig()
export type { EmailConfig }
