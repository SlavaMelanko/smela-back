export interface SenderProfile {
  email: string
  name: string
  use: string[]
}

export const senderProfiles: Record<string, SenderProfile> = {
  system: {
    email: 'noreply@company.com',
    name: 'The Company',
    use: ['welcome', 'verification', 'password-reset'],
  },
  support: {
    email: 'support@company.com',
    name: 'Company Support Team',
    use: ['help', 'feedback', 'notifications'],
  },
  ceo: {
    email: 'ceo@company.com',
    name: 'John Doe, CEO',
    use: ['announcements', 'company-updates'],
  },
  marketing: {
    email: 'marketing@company.com',
    name: 'Company Marketing',
    use: ['newsletters', 'promotions'],
  },
}

export const getSenderProfile = (emailType: string): SenderProfile => {
  const profile = Object.values(senderProfiles).find(p => p.use.includes(emailType))

  return profile || senderProfiles.system
}
