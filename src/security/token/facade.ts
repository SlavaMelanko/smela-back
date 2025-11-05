import { createHasher } from '@/crypto'

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

interface HashedToken {
  type: TokenType
  token: {
    raw: string
    hashed: string
  }
  expiresAt: Date
}

export const hashToken = async (token: string): Promise<string> => {
  const hasher = createHasher('sha256')

  return hasher.hash(token)
}

export const generateHashedToken = async (
  type: TokenType,
  options?: Options,
): Promise<HashedToken> => {
  const { token: raw, expiresAt } = generateToken(type, options)
  const hashed = await hashToken(raw)

  return {
    type,
    token: {
      raw,
      hashed,
    },
    expiresAt,
  }
}
