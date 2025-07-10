import crypto from 'node:crypto'

import type TokenGenerator from './token-generator'

import { TOKEN_EXPIRY_HOURS, TOKEN_LENGTH } from '../token-consts'

class CryptoTokenGenerator implements TokenGenerator {
  private readonly tokenLength: number
  private readonly expiryHours: number

  constructor(tokenLength = TOKEN_LENGTH, expiryHours = TOKEN_EXPIRY_HOURS) {
    this.tokenLength = tokenLength
    this.expiryHours = expiryHours
  }

  generate(): string {
    const numberOfBytes = this.tokenLength / 2

    return crypto.randomBytes(numberOfBytes).toString('hex')
  }

  generateWithExpiry(): { token: string, expiresAt: Date } {
    const token = this.generate()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + this.expiryHours)

    return { token, expiresAt }
  }
}

export default CryptoTokenGenerator
