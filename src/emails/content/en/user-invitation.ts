import type UserInvitationContent from '../user-invitation'

import { config } from '../../config'

const DEFAULT_TEAM = 'the team'

export const content: UserInvitationContent = {
  subject: (companyName?: string) => `You're invited to ${companyName || DEFAULT_TEAM}`,
  previewText: (companyName?: string) => `You're invited to ${companyName || DEFAULT_TEAM}`,
  greeting: (firstName?: string) => `Hi ${firstName || 'there'},`,
  body: (inviterName?: string, companyName?: string) =>
    `${inviterName || 'Admin'} invited you to join the ${companyName || DEFAULT_TEAM} team.`,
  ctaInstruction: 'Click the link below to accept the invitation and finish setting up your account:',
  ctaText: 'Accept invitation',
  expiryNotice: 'This link expires in 24 hours for security reasons.',
  signature: {
    thanks: 'Thanks,',
    who: `The ${config.company.name} Team`,
  },
}

export default content
