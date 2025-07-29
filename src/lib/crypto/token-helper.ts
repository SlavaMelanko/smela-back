import type { Token } from '@/types'

import { TOKEN_EXPIRY_HOURS, TOKEN_LENGTH } from '../token-consts'
import CryptoTokenGenerator from './token-generator-crypto'

interface TokenOptions {
  expiryHours?: number
  tokenLength?: number
}

interface GeneratedToken {
  type: Token
  token: string
  expiresAt: Date
}

export const generateToken = (type: Token, options?: TokenOptions): GeneratedToken => {
  const expiryHours = options?.expiryHours ?? TOKEN_EXPIRY_HOURS
  const tokenLength = options?.tokenLength ?? TOKEN_LENGTH

  const tokenGenerator = new CryptoTokenGenerator(tokenLength, expiryHours)
  const { token, expiresAt } = tokenGenerator.generateWithExpiry()

  return { type, token, expiresAt }
}
