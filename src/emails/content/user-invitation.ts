export default interface UserInvitationContent {
  subject: (teamName?: string) => string
  previewText: (inviterName?: string, teamName?: string) => string
  greeting: (firstName?: string) => string
  body: (inviterName?: string, teamName?: string) => string
  ctaInstruction: string
  ctaText: string
  expiryNotice: string
  signature: {
    thanks: string
    who: string
  }
}
