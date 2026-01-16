export default interface UserInvitationContent {
  subject: (companyName?: string) => string
  previewText: (companyName?: string) => string
  greeting: (firstName?: string) => string
  body: (companyName?: string) => string
  ctaInstruction: string
  ctaText: string
  expiryNotice: string
  signature: {
    thanks: string
    who: string
  }
}
