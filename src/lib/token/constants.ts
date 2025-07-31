const TOKEN_LENGTH = 64
const TOKEN_EXPIRY_HOURS = 24 // Default fallback

// Specific expiry times by token type
const EMAIL_VERIFICATION_EXPIRY_HOURS = 48 // hours - users need time to check email
const PASSWORD_RESET_EXPIRY_HOURS = 1 // hour - security sensitive, users act quickly

export {
  EMAIL_VERIFICATION_EXPIRY_HOURS,
  PASSWORD_RESET_EXPIRY_HOURS,
  TOKEN_EXPIRY_HOURS,
  TOKEN_LENGTH,
}
