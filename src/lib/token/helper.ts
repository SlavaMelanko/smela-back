import type { Token } from '@/types'

import type { Options } from './options'

import CryptoTokenGenerator from './token-generator-crypto'

interface GeneratedToken {
  type: Token
  token: string
  expiresAt: Date
}

export const generateToken = (type: Token, options?: Options): GeneratedToken => {
  const tokenGenerator = new CryptoTokenGenerator(options)
  const { token, expiresAt } = tokenGenerator.generateWithExpiry()

  return { type, token, expiresAt }
}
