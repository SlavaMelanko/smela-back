export interface SenderProfile {
  email: string
  name: string
  use: string[]
}

export const senderProfiles: Record<string, SenderProfile> = {
  system: {
    email: 'admin@smela.pro', // noreply
    name: 'The Company',
    use: ['welcome', 'verification', 'password-reset'],
  },
  support: {
    email: 'admin@smela.pro', // support
    name: 'Company Support Team',
    use: ['help', 'feedback', 'notifications'],
  },
  ceo: {
    email: 'admin@smela.pro', // ceo
    name: 'John Doe, CEO',
    use: ['announcements', 'company-updates'],
  },
  marketing: {
    email: 'admin@smela.pro', // marketing
    name: 'Company Marketing',
    use: ['newsletters', 'promotions'],
  },
}

export const getSenderProfile = (emailType: string): SenderProfile => {
  const profile = Object.values(senderProfiles).find(p => p.use.includes(emailType))

  return profile || senderProfiles.system
}
