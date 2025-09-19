interface EmailConfig {
  company: {
    name: string
    socialMediaLinks: Record<string, string>
  }
}

const createEmailConfig = (): EmailConfig => {
  return {
    company: {
      name: 'SMELA',
      socialMediaLinks: {
        twitter: 'https://twitter.com',
        facebook: 'https://facebook.com',
        linkedin: 'https://linkedin.com',
        github: 'https://github.com',
      },
    },
  }
}

const config = createEmailConfig()

export type { EmailConfig }

export { config }
