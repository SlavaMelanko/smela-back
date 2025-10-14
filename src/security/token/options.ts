import { Token } from '@/types'

export const TOKEN_LENGTH = 64
export const DEFAULT_EXPIRY_HOURS = 24

// Token type-specific expiry times
export const EMAIL_VERIFICATION_EXPIRY_HOURS = 48 // hours - users need time to check email
export const PASSWORD_RESET_EXPIRY_HOURS = 1 // hour - security sensitive, users act quickly

export interface Options {
  expiryHours?: number
  tokenLength?: number
}

export const defaultOptionsMap = new Map<Token, Required<Options>>([
  [Token.EmailVerification, {
    expiryHours: EMAIL_VERIFICATION_EXPIRY_HOURS,
    tokenLength: TOKEN_LENGTH,
  }],
  [Token.PasswordReset, {
    expiryHours: PASSWORD_RESET_EXPIRY_HOURS,
    tokenLength: TOKEN_LENGTH,
  }],
])

export const getDefaultOptions = (type: Token): Required<Options> => {
  const options = defaultOptionsMap.get(type)

  if (!options) {
    throw new Error(`Unknown token type: ${type}`)
  }

  return options
}
