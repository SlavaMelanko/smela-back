import type UserInvitationContent from '../user-invitation'

import { config } from '../../config'

const DEFAULT_TEAM = 'the team'

export const content: UserInvitationContent = {
  subject: (teamName?: string) => `You're invited to ${teamName || DEFAULT_TEAM}`,
  previewText: (teamName?: string) => `You're invited to ${teamName || DEFAULT_TEAM}`,
  greeting: (firstName?: string) => `Hi ${firstName || 'there'},`,
  body: (inviterName?: string, teamName?: string) =>
    `${inviterName || 'Admin'} invited you to join the ${teamName || DEFAULT_TEAM} team.`,
  ctaInstruction: 'Click the link below to accept the invitation and finish setting up your account:',
  ctaText: 'Accept invitation',
  expiryNotice: 'This link expires in 24 hours for security reasons.',
  signature: {
    thanks: 'Thanks,',
    who: `The ${config.company.name} Team`,
  },
}

export default content
