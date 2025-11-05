import { TokenType } from './types'

export const TOKEN_LENGTH = 64

export const DEFAULT_EXPIRY_SECONDS = 86400 // 24 hours
export const EMAIL_VERIFICATION_EXPIRY_SECONDS = 172800 // 48 hours
export const PASSWORD_RESET_EXPIRY_SECONDS = 3600 // 1 hour
export const REFRESH_TOKEN_EXPIRY_SECONDS = 2592000 // 30 days

export interface Options {
  expirySeconds?: number
  tokenLength?: number
}

export const defaultOptionsMap = new Map<TokenType, Required<Options>>([
  [TokenType.EmailVerification, {
    expirySeconds: EMAIL_VERIFICATION_EXPIRY_SECONDS,
    tokenLength: TOKEN_LENGTH,
  }],
  [TokenType.PasswordReset, {
    expirySeconds: PASSWORD_RESET_EXPIRY_SECONDS,
    tokenLength: TOKEN_LENGTH,
  }],
  [TokenType.RefreshToken, {
    expirySeconds: REFRESH_TOKEN_EXPIRY_SECONDS,
    tokenLength: TOKEN_LENGTH,
  }],
])

export const getDefaultOptions = (type: TokenType): Required<Options> => {
  const options = defaultOptionsMap.get(type)

  if (!options) {
    throw new Error(`Unknown token type: ${type}`)
  }

  return options
}
