import type { TokenRecord } from '@/repositories/token'
import type { SecureToken } from '@/types'

import HttpError from '@/lib/http-error'

class TokenValidator {
  static validate(tokenRecord: TokenRecord | undefined, expectedType: SecureToken): TokenRecord {
    TokenValidator.shouldExist(tokenRecord)
    TokenValidator.shouldNotBeUsed(tokenRecord)
    TokenValidator.hasExpectedType(tokenRecord, expectedType)
    TokenValidator.shouldNotBeExpired(tokenRecord)

    return tokenRecord
  }

  static shouldExist(tokenRecord: TokenRecord | undefined): asserts tokenRecord is TokenRecord {
    if (!tokenRecord) {
      throw new HttpError(400, 'Token not found')
    }
  }

  static shouldNotBeUsed(tokenRecord: TokenRecord): void {
    if (tokenRecord.usedAt) {
      throw new HttpError(400, 'Token has already been used')
    }
  }

  static hasExpectedType(tokenRecord: TokenRecord, expectedType: SecureToken): void {
    if (tokenRecord.type !== expectedType) {
      throw new HttpError(400, `Token type mismatch: expected ${expectedType}, got ${tokenRecord.type}`)
    }
  }

  static shouldNotBeExpired(tokenRecord: TokenRecord): void {
    if (tokenRecord.expiresAt < new Date()) {
      throw new HttpError(400, 'Token has expired')
    }
  }
}

export default TokenValidator
