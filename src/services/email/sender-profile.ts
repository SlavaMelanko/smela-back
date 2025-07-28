import env from '@/lib/env'

import type { EmailType } from './registry'

export interface SenderProfile {
  email: string
  name: string
  use: string[]
}

export const senderProfiles: Record<string, SenderProfile> = env.EMAIL_SENDER_PROFILES

export const getSenderProfile = (emailType: EmailType): SenderProfile => {
  const profile = Object.values(senderProfiles).find(p => p.use.includes(emailType))

  return profile || senderProfiles.system
}
