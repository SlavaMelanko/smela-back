import env from '@/lib/env'

export interface SenderProfile {
  email: string
  name: string
  use: string[]
}

export const senderProfiles: Record<string, SenderProfile> = env.EMAIL_SENDER_PROFILES

export const getSenderProfile = (emailType: string): SenderProfile => {
  const profile = Object.values(senderProfiles).find(p => p.use.includes(emailType))

  return profile || senderProfiles.system
}
