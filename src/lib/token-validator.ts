import type { TokenRecord } from '@/repositories/token'
import type { Token } from '@/types'

import HttpError from '@/lib/http-error'
import { TokenStatus } from '@/types'

class TokenValidator {
  static validate(tokenRecord: TokenRecord | undefined, expectedType: Token): TokenRecord {
    TokenValidator.shouldExist(tokenRecord)
    TokenValidator.shouldNotBeUsed(tokenRecord)
    TokenValidator.shouldNotBeDeprecated(tokenRecord)
    TokenValidator.shouldNotBeExpired(tokenRecord)
    TokenValidator.hasExpectedType(tokenRecord, expectedType)

    return tokenRecord
  }

  static shouldExist(tokenRecord: TokenRecord | undefined): asserts tokenRecord is TokenRecord {
    if (!tokenRecord) {
      throw new HttpError(400, 'Token not found')
    }
  }

  static shouldNotBeUsed(tokenRecord: TokenRecord): void {
    if (tokenRecord.status === TokenStatus.Used || tokenRecord.usedAt) {
      throw new HttpError(400, 'Token has already been used')
    }
  }

  static shouldNotBeDeprecated(tokenRecord: TokenRecord): void {
    if (tokenRecord.status === TokenStatus.Deprecated) {
      throw new HttpError(400, 'Token has been deprecated')
    }
  }

  static shouldNotBeExpired(tokenRecord: TokenRecord): void {
    if (tokenRecord.expiresAt < new Date()) {
      throw new HttpError(400, 'Token has expired')
    }
  }

  static hasExpectedType(tokenRecord: TokenRecord, expectedType: Token): void {
    if (tokenRecord.type !== expectedType) {
      throw new HttpError(400, `Token type mismatch: expected ${expectedType}, got ${tokenRecord.type}`)
    }
  }
}

export default TokenValidator
