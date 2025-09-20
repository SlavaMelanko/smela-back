interface PasswordResetEmailContent {
  subject: string
  previewText: string
  greeting: (firstName?: string) => string
  body: string
  ctaText: string
  disclaimer: string
  expiryNotice: string
  signature: {
    thanks: string
    who: string
  }
}

export default PasswordResetEmailContent
