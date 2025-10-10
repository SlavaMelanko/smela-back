import { describe, expect, it } from 'bun:test'

import { signJwt, verifyJwt } from '@/jwt'
import { AppError, ErrorCode } from '@/lib/catch'
import { Role, Status } from '@/types'

describe('JWT Integration Tests', () => {
  const userClaims = {
    id: 1,
    email: 'test@example.com',
    role: Role.User,
    status: Status.Active,
    tokenVersion: 0,
  }

  describe('signJwt + verifyJwt round-trip', () => {
    it('should create and verify valid JWT token', async () => {
      const secret = 'test-secret-key'

      const token = await signJwt(userClaims, { secret })

      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3)

      const payload = await verifyJwt(token, { secret })

      expect(payload.id).toBe(userClaims.id)
      expect(payload.email).toBe(userClaims.email)
      expect(payload.role).toBe(userClaims.role)
      expect(payload.status).toBe(userClaims.status)
      expect(payload.v).toBe(userClaims.tokenVersion)
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })

    it('should respect custom expiration time', async () => {
      const secret = 'test-secret-key'
      const customExpiresIn = 7200

      const token = await signJwt(userClaims, { secret, expiresIn: customExpiresIn })

      const payload = await verifyJwt(token, { secret })
      const expectedExp = Math.floor(Date.now() / 1000) + customExpiresIn

      expect(payload.exp).toBeGreaterThanOrEqual(expectedExp - 1)
      expect(payload.exp).toBeLessThanOrEqual(expectedExp + 1)
    })

    it('should include token version in verified payload', async () => {
      const secret = 'test-secret-key'
      const claimsWithVersion = { ...userClaims, tokenVersion: 5 }

      const token = await signJwt(claimsWithVersion, { secret })
      const payload = await verifyJwt(token, { secret })

      expect(payload.v).toBe(5)
    })

    it('should handle different user roles', async () => {
      const secret = 'test-secret-key'
      const adminClaims = { ...userClaims, role: Role.Admin }

      const token = await signJwt(adminClaims, { secret })
      const payload = await verifyJwt(token, { secret })

      expect(payload.role).toBe(Role.Admin)
    })

    it('should handle different user statuses', async () => {
      const secret = 'test-secret-key'
      const newUserClaims = { ...userClaims, status: Status.New }

      const token = await signJwt(newUserClaims, { secret })
      const payload = await verifyJwt(token, { secret })

      expect(payload.status).toBe(Status.New)
    })
  })

  describe('verifyJwt error cases', () => {
    it('should fail verification with wrong secret', async () => {
      const token = await signJwt(userClaims, { secret: 'correct-secret' })

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
      const token = await signJwt(userClaims, { secret: 'secret-one' })

      expect(verifyJwt(token, { secret: 'secret-two' })).rejects.toThrow(AppError)
    })
  })

  describe('signJwt token structure', () => {
    it('should create valid JWT structure', async () => {
      const token = await signJwt(userClaims, { secret: 'test-secret' })
      const parts = token.split('.')

      expect(parts).toHaveLength(3)
      expect(parts[0].length).toBeGreaterThan(0)
      expect(parts[1].length).toBeGreaterThan(0)
      expect(parts[2].length).toBeGreaterThan(0)
    })

    it('should create different tokens for different users', async () => {
      const secret = 'test-secret'
      const user1 = { ...userClaims, id: 1 }
      const user2 = { ...userClaims, id: 2 }

      const token1 = await signJwt(user1, { secret })
      const token2 = await signJwt(user2, { secret })

      expect(token1).not.toBe(token2)
    })

    it('should create different tokens with different secrets', async () => {
      const token1 = await signJwt(userClaims, { secret: 'secret-one' })
      const token2 = await signJwt(userClaims, { secret: 'secret-two' })

      expect(token1).not.toBe(token2)
    })
  })
})
