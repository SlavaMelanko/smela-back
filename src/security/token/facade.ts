import type { Token } from '@/types'

import type { Options } from './options'

import { getDefaultOptions } from './options'
import CryptoTokenGenerator from './token-generator-crypto'

interface GeneratedToken {
  type: Token
  token: string
  expiresAt: Date
}

export const generateToken = (type: Token, options?: Options): GeneratedToken => {
  const defaultOptions = getDefaultOptions(type)
  const tokenGenerator = new CryptoTokenGenerator({ ...defaultOptions, ...options })
  const { token, expiresAt } = tokenGenerator.generateWithExpiry()

  return { type, token, expiresAt }
}
