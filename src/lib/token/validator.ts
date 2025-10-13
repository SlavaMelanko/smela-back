import type { TokenRecord } from '@/data'
import type { Token } from '@/types'

import { AppError, ErrorCode } from '@/errors'
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
      throw new AppError(ErrorCode.TokenNotFound)
    }
  }

  static shouldNotBeUsed(tokenRecord: TokenRecord): void {
    if (tokenRecord.status === TokenStatus.Used || tokenRecord.usedAt) {
      throw new AppError(ErrorCode.TokenAlreadyUsed)
    }
  }

  static shouldNotBeDeprecated(tokenRecord: TokenRecord): void {
    if (tokenRecord.status === TokenStatus.Deprecated) {
      throw new AppError(ErrorCode.TokenDeprecated)
    }
  }

  static shouldNotBeExpired(tokenRecord: TokenRecord): void {
    if (tokenRecord.expiresAt < new Date()) {
      throw new AppError(ErrorCode.TokenExpired)
    }
  }

  static hasExpectedType(tokenRecord: TokenRecord, expectedType: Token): void {
    if (tokenRecord.type !== expectedType) {
      throw new AppError(ErrorCode.TokenTypeMismatch, `Token type mismatch: expected ${expectedType}, got ${tokenRecord.type}`)
    }
  }
}

export default TokenValidator
