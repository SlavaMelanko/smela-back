interface EmailConfig {
  baseUrl: string // Backend URL for assets
  frontendUrl: string // Frontend URL for user-facing links
  company: {
    name: string
    social: Record<string, string>
  }
}

const getEmailConfig = (): EmailConfig => {
  return {
    baseUrl: '',
    frontendUrl: '',
    company: {
      name: 'SMELA',
      social: JSON.parse('{"twitter": "https://twitter.com", "facebook": "https://facebook.com", "linkedin": "https://linkedin.com", "github": "https://github.com"}'),
    },
  }
}

const config = getEmailConfig()

export type { EmailConfig }

export { config }
