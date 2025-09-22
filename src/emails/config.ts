import { env } from './env'

export interface EmailConfig {
  company: {
    name: string
    socialMediaLinks: Record<string, string>
  }
}

const createEmailConfig = (): EmailConfig => {
  return {
    company: {
      name: env.companyName,
      socialMediaLinks: env.companySocialLinks,
    },
  }
}

export const config = createEmailConfig()
