import type { Options } from './options'
import type { TokenType } from './types'

import { getDefaultOptions } from './options'
import CryptoTokenGenerator from './token-generator-crypto'

interface GeneratedToken {
  type: TokenType
  token: string
  expiresAt: Date
}

export const generateToken = (type: TokenType, options?: Options): GeneratedToken => {
  const defaultOptions = getDefaultOptions(type)
  const tokenGenerator = new CryptoTokenGenerator({ ...defaultOptions, ...options })
  const { token, expiresAt } = tokenGenerator.generateWithExpiry()

  return { type, token, expiresAt }
}
