import { describe, expect, it } from 'bun:test'

import { ModuleMocker } from '@/__tests__'
import { seconds } from '@/utils/chrono'

import { generateHashedToken, generateToken } from '../facade'
import {
  EMAIL_VERIFICATION_EXPIRY_SECONDS,
  PASSWORD_RESET_EXPIRY_SECONDS,
  REFRESH_TOKEN_EXPIRY_SECONDS,
} from '../options'
import { TokenType } from '../types'

describe('Token Facade', () => {
  describe('generateToken', () => {
    it('should generate EmailVerification token with default options', () => {
      const beforeGeneration = new Date()
      const result = generateToken(TokenType.EmailVerification)
      const afterGeneration = new Date()

      expect(result.type).toBe(TokenType.EmailVerification)
      expect(result.token).toBeDefined()
      expect(typeof result.token).toBe('string')
      expect(result.token.length).toBe(64)
      expect(/^[0-9a-f]+$/.test(result.token)).toBe(true)

      const expectedMinExpiry = new Date(
        beforeGeneration.getTime() + seconds(EMAIL_VERIFICATION_EXPIRY_SECONDS),
      )
      const expectedMaxExpiry = new Date(
        afterGeneration.getTime() + seconds(EMAIL_VERIFICATION_EXPIRY_SECONDS),
      )

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpiry.getTime())
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxExpiry.getTime())
    })

    it('should generate PasswordReset token with default options', () => {
      const beforeGeneration = new Date()
      const result = generateToken(TokenType.PasswordReset)
      const afterGeneration = new Date()

      expect(result.type).toBe(TokenType.PasswordReset)
      expect(result.token).toBeDefined()
      expect(typeof result.token).toBe('string')
      expect(result.token.length).toBe(64)
      expect(/^[0-9a-f]+$/.test(result.token)).toBe(true)

      const expectedMinExpiry = new Date(
        beforeGeneration.getTime() + seconds(PASSWORD_RESET_EXPIRY_SECONDS),
      )
      const expectedMaxExpiry = new Date(
        afterGeneration.getTime() + seconds(PASSWORD_RESET_EXPIRY_SECONDS),
      )

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpiry.getTime())
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxExpiry.getTime())
    })

    it('should generate unique tokens on consecutive calls', () => {
      const result1 = generateToken(TokenType.EmailVerification)
      const result2 = generateToken(TokenType.EmailVerification)

      expect(result1.token).not.toBe(result2.token)
    })

    it('should accept custom options for length and expiry', () => {
      const CUSTOM_LENGTH = 32
      const CUSTOM_EXPIRY = 7200

      const beforeGeneration = new Date()
      const result = generateToken(TokenType.EmailVerification, {
        tokenLength: CUSTOM_LENGTH,
        expirySeconds: CUSTOM_EXPIRY,
      })
      const afterGeneration = new Date()

      expect(result.token.length).toBe(CUSTOM_LENGTH)
      expect(/^[0-9a-f]+$/.test(result.token)).toBe(true)

      const expectedMinExpiry = new Date(
        beforeGeneration.getTime() + seconds(CUSTOM_EXPIRY),
      )
      const expectedMaxExpiry = new Date(
        afterGeneration.getTime() + seconds(CUSTOM_EXPIRY),
      )

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpiry.getTime())
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxExpiry.getTime())
    })

    it('should handle zero expiry seconds', () => {
      const beforeGeneration = new Date()
      const result = generateToken(TokenType.EmailVerification, {
        expirySeconds: 0,
      })
      const afterGeneration = new Date()

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(beforeGeneration.getTime())
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(afterGeneration.getTime())
    })
  })

  describe('generateHashedToken', () => {
    it('should generate RefreshToken hashed token with default options', async () => {
      const beforeGeneration = new Date()
      const result = await generateHashedToken(TokenType.RefreshToken)
      const afterGeneration = new Date()

      expect(result.type).toBe(TokenType.RefreshToken)
      expect(result.token).toBeDefined()
      expect(result.token.raw).toBeDefined()
      expect(result.token.hashed).toBeDefined()
      expect(typeof result.token.raw).toBe('string')
      expect(typeof result.token.hashed).toBe('string')
      expect(result.token.raw).not.toBe(result.token.hashed)
      expect(result.token.raw.length).toBe(64)
      expect(/^[0-9a-f]+$/.test(result.token.raw)).toBe(true)
      expect(/^[0-9a-f]+$/.test(result.token.hashed)).toBe(true)

      const expectedMinExpiry = new Date(
        beforeGeneration.getTime() + seconds(REFRESH_TOKEN_EXPIRY_SECONDS),
      )
      const expectedMaxExpiry = new Date(
        afterGeneration.getTime() + seconds(REFRESH_TOKEN_EXPIRY_SECONDS),
      )

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpiry.getTime())
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxExpiry.getTime())
    })

    it('should throw error when token is empty string', async () => {
      const moduleMocker = new ModuleMocker(import.meta.url)

      await moduleMocker.mock('../token-generator-crypto', () => ({
        default: class MockTokenGenerator {
          generateWithExpiry() {
            return { token: '', expiresAt: new Date() }
          }
        },
      }))

      const { generateHashedToken: mockedGenerateHashedToken } = await import('../facade')

      expect(mockedGenerateHashedToken(TokenType.RefreshToken)).rejects.toThrow(
        'Token must be a non-empty string',
      )

      await moduleMocker.clear()
    })
  })
})
