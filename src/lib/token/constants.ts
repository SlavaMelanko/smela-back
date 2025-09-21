export const TOKEN_LENGTH = 64
export const TOKEN_EXPIRY_HOURS = 24 // Default fallback

// Specific expiry times by token type
export const EMAIL_VERIFICATION_EXPIRY_HOURS = 48 // hours - users need time to check email
export const PASSWORD_RESET_EXPIRY_HOURS = 1 // hour - security sensitive, users act quickly
