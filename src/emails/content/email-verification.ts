export default interface EmailVerificationContent {
  subject: string
  previewText: string
  greeting: (firstName?: string) => string
  body: string
  ctaText: string
  disclaimer: string
  signature: {
    thanks: string
    who: string
  }
}
