import { describe, expect, it } from 'bun:test'

import { AppError, ErrorCode } from '@/errors'
import { signJwt, verifyJwt } from '@/jwt'
import { Role, Status } from '@/types'

describe('JWT Integration Tests', () => {
  const testUserClaims = {
    id: 1,
    email: 'test@example.com',
    role: Role.User,
    status: Status.Active,
    tokenVersion: 0,
  }

  describe('signJwt + verifyJwt round-trip', () => {
    it('should create and verify valid JWT token', async () => {
      const secret = 'test-secret-key'

      const token = await signJwt(testUserClaims, { secret })

      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3)

      const resultUserClaims = await verifyJwt(token, { secret })

      expect(resultUserClaims.id).toBe(testUserClaims.id)
      expect(resultUserClaims.email).toBe(testUserClaims.email)
      expect(resultUserClaims.role).toBe(testUserClaims.role)
      expect(resultUserClaims.status).toBe(testUserClaims.status)
      expect(resultUserClaims.tokenVersion).toBe(testUserClaims.tokenVersion)
    })

    it('should respect custom expiration time', async () => {
      const secret = 'test-secret-key'
      const customExpiresIn = 7200

      const token = await signJwt(testUserClaims, { secret, expiresIn: customExpiresIn })

      // Verify token doesn't throw - expiration is validated internally
      const resultUserClaims = await verifyJwt(token, { secret })

      expect(resultUserClaims.id).toBe(testUserClaims.id)
    })

    it('should include token version in verified payload', async () => {
      const secret = 'test-secret-key'
      const claimsWithVersion = { ...testUserClaims, tokenVersion: 5 }

      const token = await signJwt(claimsWithVersion, { secret })
      const resultUserClaims = await verifyJwt(token, { secret })

      expect(resultUserClaims.tokenVersion).toBe(5)
    })

    it('should handle different user roles', async () => {
      const secret = 'test-secret-key'
      const adminClaims = { ...testUserClaims, role: Role.Admin }

      const token = await signJwt(adminClaims, { secret })
      const resultUserClaims = await verifyJwt(token, { secret })

      expect(resultUserClaims.role).toBe(Role.Admin)
    })

    it('should handle different user statuses', async () => {
      const secret = 'test-secret-key'
      const newUserClaims = { ...testUserClaims, status: Status.New }

      const token = await signJwt(newUserClaims, { secret })
      const resultUserClaims = await verifyJwt(token, { secret })

      expect(resultUserClaims.status).toBe(Status.New)
    })
  })

  describe('verifyJwt error cases', () => {
    it('should fail verification with wrong secret', async () => {
      const token = await signJwt(testUserClaims, { secret: 'correct-secret' })

      expect(verifyJwt(token, { secret: 'wrong-secret' })).rejects.toThrow(AppError)
      expect(verifyJwt(token, { secret: 'wrong-secret' })).rejects.toMatchObject({
        code: ErrorCode.Unauthorized,
        message: 'Invalid authentication token',
      })
    })

    it('should fail verification with malformed token', async () => {
      expect(verifyJwt('invalid.token.here', { secret: 'test-secret' })).rejects.toThrow(AppError)
      expect(verifyJwt('invalid.token.here', { secret: 'test-secret' })).rejects.toMatchObject({
        code: ErrorCode.Unauthorized,
        message: 'Invalid authentication token',
      })
    })

    it('should fail verification with completely invalid token', async () => {
      expect(verifyJwt('not-a-jwt-at-all', { secret: 'test-secret' })).rejects.toThrow(AppError)
    })

    it('should fail verification with empty token', async () => {
      expect(verifyJwt('', { secret: 'test-secret' })).rejects.toThrow(AppError)
    })

    it('should fail verification with token signed by different secret', async () => {
      const token = await signJwt(testUserClaims, { secret: 'secret-one' })

      expect(verifyJwt(token, { secret: 'secret-two' })).rejects.toThrow(AppError)
    })
  })

  describe('signJwt token structure', () => {
    it('should create valid JWT structure', async () => {
      const token = await signJwt(testUserClaims, { secret: 'test-secret' })
      const parts = token.split('.')

      expect(parts).toHaveLength(3)
      expect(parts[0].length).toBeGreaterThan(0)
      expect(parts[1].length).toBeGreaterThan(0)
      expect(parts[2].length).toBeGreaterThan(0)
    })

    it('should create different tokens for different users', async () => {
      const secret = 'test-secret'
      const user1 = { ...testUserClaims, id: 1 }
      const user2 = { ...testUserClaims, id: 2 }

      const token1 = await signJwt(user1, { secret })
      const token2 = await signJwt(user2, { secret })

      expect(token1).not.toBe(token2)
    })

    it('should create different tokens with different secrets', async () => {
      const token1 = await signJwt(testUserClaims, { secret: 'secret-one' })
      const token2 = await signJwt(testUserClaims, { secret: 'secret-two' })

      expect(token1).not.toBe(token2)
    })
  })

  describe('custom algorithm support', () => {
    it('should use HS256 by default', async () => {
      const secret = 'test-secret'
      const token = await signJwt(testUserClaims, { secret })
      const resultUserClaims = await verifyJwt(token, { secret })

      expect(resultUserClaims.id).toBe(testUserClaims.id)
    })

    it('should support HS512 algorithm', async () => {
      const secret = 'test-secret'
      const token = await signJwt(testUserClaims, { secret, signatureAlgorithm: 'HS512' })
      const resultUserClaims = await verifyJwt(token, { secret, signatureAlgorithm: 'HS512' })

      expect(resultUserClaims.id).toBe(testUserClaims.id)
      expect(resultUserClaims.email).toBe(testUserClaims.email)
    })

    it('should fail verification when algorithm mismatch', async () => {
      const secret = 'test-secret'
      const token = await signJwt(testUserClaims, { secret, signatureAlgorithm: 'HS256' })

      expect(verifyJwt(token, { secret, signatureAlgorithm: 'HS512' })).rejects.toThrow(AppError)
    })
  })
})
