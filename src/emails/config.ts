import env from '../lib/env'

interface EmailConfig {
  baseUrl: string // Backend URL for assets
  frontendUrl: string // Frontend URL for user-facing links
  company: {
    name: string
    social: Record<string, string>
  }
}

const getEmailConfig = (): EmailConfig => {
  const baseUrl = env.BE_BASE_URL
  const frontendUrl = env.FE_BASE_URL
  const companyName = env.COMPANY_NAME

  return {
    baseUrl,
    frontendUrl,
    company: {
      name: companyName,
      social: env.COMPANY_SOCIAL_LINKS,
    },
  }
}

const config = getEmailConfig()

export type { EmailConfig }

export { config }
