import { env } from './env'

interface EmailConfig {
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

const config = createEmailConfig()

export type { EmailConfig }

export { config }
