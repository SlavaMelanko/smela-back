import { describe, expect, it } from 'bun:test'

import type { TokenRecord } from '@/data'

import { testUuids } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'

import { TokenStatus, TokenType } from '../types'
import TokenValidator from '../validator'

describe('TokenValidator', () => {
  const createValidToken = (overrides?: Partial<TokenRecord>): TokenRecord => ({
    id: 1,
    userId: testUuids.USER_1,
    type: TokenType.EmailVerification,
    status: TokenStatus.Pending,
    token: 'valid-token-123',
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    usedAt: null,
    metadata: null,
    createdAt: new Date(),
    ...overrides,
  })

  describe('validate', () => {
    it('should pass validation for valid token', () => {
      const token = createValidToken()

      const result = TokenValidator.validate(token, TokenType.EmailVerification)

      expect(result).toBe(token)
    })

    it('should throw TokenNotFound when token is undefined', () => {
      expect(() => {
        TokenValidator.validate(undefined, TokenType.EmailVerification)
      }).toThrow(new AppError(ErrorCode.TokenNotFound))
    })

    it('should throw TokenAlreadyUsed when status is Used', () => {
      const token = createValidToken({ status: TokenStatus.Used })

      expect(() => {
        TokenValidator.validate(token, TokenType.EmailVerification)
      }).toThrow(new AppError(ErrorCode.TokenAlreadyUsed))
    })

    it('should throw TokenAlreadyUsed when usedAt is set', () => {
      const token = createValidToken({ usedAt: new Date() })

      expect(() => {
        TokenValidator.validate(token, TokenType.EmailVerification)
      }).toThrow(new AppError(ErrorCode.TokenAlreadyUsed))
    })

    it('should throw TokenDeprecated when status is Deprecated', () => {
      const token = createValidToken({ status: TokenStatus.Deprecated })

      expect(() => {
        TokenValidator.validate(token, TokenType.EmailVerification)
      }).toThrow(new AppError(ErrorCode.TokenDeprecated))
    })

    it('should throw TokenExpired when token is expired', () => {
      const token = createValidToken({ expiresAt: new Date(Date.now() - 1000) })

      expect(() => {
        TokenValidator.validate(token, TokenType.EmailVerification)
      }).toThrow(new AppError(ErrorCode.TokenExpired))
    })

    it('should throw TokenTypeMismatch when type does not match', () => {
      const token = createValidToken({ type: TokenType.PasswordReset })

      expect(() => {
        TokenValidator.validate(token, TokenType.EmailVerification)
      }).toThrow(AppError)
    })
  })
})
