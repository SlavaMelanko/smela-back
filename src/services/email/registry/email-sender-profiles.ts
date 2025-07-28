import env from '@/lib/env'

export enum SenderProfile {
  SYSTEM = 'system',
  SUPPORT = 'support',
  CEO = 'ceo',
  MARKETING = 'marketing',
}

export interface EmailSender {
  email: string
  name: string
}

export const getSenderProfile = (senderProfile: SenderProfile): EmailSender => {
  const profiles = env.EMAIL_SENDER_PROFILES
  const profile = profiles[senderProfile] || profiles[SenderProfile.SYSTEM]

  return {
    email: profile.email,
    name: profile.name,
  }
}
