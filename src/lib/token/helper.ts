import { Token } from '@/types'

import type { Options } from './options'

import {
  EMAIL_VERIFICATION_EXPIRY_HOURS,
  PASSWORD_RESET_EXPIRY_HOURS,
  TOKEN_LENGTH,
} from './constants'
import CryptoTokenGenerator from './token-generator-crypto'

interface GeneratedToken {
  type: Token
  token: string
  expiresAt: Date
}

const TOKEN_TYPE_OPTIONS: Record<Token, Required<Options>> = {
  [Token.EmailVerification]: {
    expiryHours: EMAIL_VERIFICATION_EXPIRY_HOURS,
    tokenLength: TOKEN_LENGTH,
  },
  [Token.PasswordReset]: {
    expiryHours: PASSWORD_RESET_EXPIRY_HOURS,
    tokenLength: TOKEN_LENGTH,
  },
}

export const generateToken = (type: Token, options?: Options): GeneratedToken => {
  const defaultOptions = TOKEN_TYPE_OPTIONS[type]
  const tokenGenerator = new CryptoTokenGenerator({ ...defaultOptions, ...options })
  const { token, expiresAt } = tokenGenerator.generateWithExpiry()

  return { type, token, expiresAt }
}
