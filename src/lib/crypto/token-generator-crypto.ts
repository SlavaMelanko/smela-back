import crypto from 'node:crypto'

import type TokenGenerator from './token-generator'

class SecureTokenGenerator implements TokenGenerator {
  private readonly tokenLength: number
  private readonly expiryHours: number

  constructor(tokenLength = 32, expiryHours = 48) {
    this.tokenLength = tokenLength
    this.expiryHours = expiryHours
  }

  generate(): string {
    return crypto.randomBytes(this.tokenLength).toString('hex')
  }

  generateWithExpiry(): { token: string, expiresAt: Date } {
    const token = this.generate()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + this.expiryHours)

    return { token, expiresAt }
  }
}

export default SecureTokenGenerator
