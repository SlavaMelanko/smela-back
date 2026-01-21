import { beforeEach, describe, expect, it } from 'bun:test'

import { db } from '@/data/clients'
import { usersTable } from '@/data/schema'
import { Role, Status } from '@/types'

import { refreshTokenRepo } from '../index'

describe('Refresh Token Repository @with-db', () => {
  let userId: string
  let tokenHash: string
  let expiresAt: Date

  beforeEach(async () => {
    // Create test user
    const [user] = await db
      .insert(usersTable)
      .values({
        firstName: 'Test',
        lastName: 'User',
        email: `test-${Date.now()}@example.com`,
        status: Status.Active,
        role: Role.User,
      })
      .returning({ id: usersTable.id })

    userId = user.id
    tokenHash = `test-token-hash-${Date.now()}`
    expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  })

  describe('mutations', () => {
    it('createRefreshToken - creates token and returns ID', async () => {
      const tokenId = await refreshTokenRepo.create({
        userId,
        tokenHash,
        expiresAt,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      })

      expect(tokenId).toBeTypeOf('number')
      expect(tokenId).toBeGreaterThan(0)

      const found = await refreshTokenRepo.findByHash(tokenHash)
      expect(found).toBeDefined()
      expect(found?.userId).toBe(userId)
      expect(found?.tokenHash).toBe(tokenHash)
    })

    it('revokeByTokenHash - revokes active token', async () => {
      await refreshTokenRepo.create({
        userId,
        tokenHash,
        expiresAt,
      })

      const revoked = await refreshTokenRepo.revokeByHash(tokenHash)

      expect(revoked).toBe(true)

      const found = await refreshTokenRepo.findByHash(tokenHash)
      expect(found?.revokedAt).toBeDefined()
    })

    it('revokeAllUserTokens - revokes all user active tokens', async () => {
      await refreshTokenRepo.create({
        userId,
        tokenHash: `token-1-${Date.now()}`,
        expiresAt,
      })
      await refreshTokenRepo.create({
        userId,
        tokenHash: `token-2-${Date.now() + 1}`,
        expiresAt,
      })

      await refreshTokenRepo.revokeAllUserTokens(userId)

      const activeTokens = await refreshTokenRepo.findActiveByUserId(userId)
      expect(activeTokens).toHaveLength(0)
    })

    it('cleanupExpiredTokens - deletes expired tokens', async () => {
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      const expiredTokenHash = `expired-token-${Date.now()}`
      const validTokenHash = `valid-token-${Date.now()}`

      await refreshTokenRepo.create({
        userId,
        tokenHash: expiredTokenHash,
        expiresAt: expiredDate,
      })
      await refreshTokenRepo.create({
        userId,
        tokenHash: validTokenHash,
        expiresAt,
      })

      const deletedCount = await refreshTokenRepo.cleanupExpired()

      expect(deletedCount).toBe(1)

      const found = await refreshTokenRepo.findByHash(expiredTokenHash)
      expect(found).toBeUndefined()

      const validFound = await refreshTokenRepo.findByHash(validTokenHash)
      expect(validFound).toBeDefined()
    })
  })

  describe('queries', () => {
    it('findByHash - finds existing token', async () => {
      await refreshTokenRepo.create({
        userId,
        tokenHash,
        expiresAt,
        ipAddress: '192.168.1.1',
      })

      const found = await refreshTokenRepo.findByHash(tokenHash)

      expect(found).toBeDefined()
      expect(found?.tokenHash).toBe(tokenHash)
      expect(found?.userId).toBe(userId)
      expect(found?.ipAddress).toBe('192.168.1.1')
    })

    it('findActiveByUserId - gets active tokens for user', async () => {
      const activeTokenHash = `active-token-${Date.now()}`
      const revokedTokenHash = `revoked-token-${Date.now()}`

      await refreshTokenRepo.create({
        userId,
        tokenHash: activeTokenHash,
        expiresAt,
      })

      await refreshTokenRepo.create({
        userId,
        tokenHash: revokedTokenHash,
        expiresAt,
      })
      await refreshTokenRepo.revokeByHash(revokedTokenHash)

      const activeTokens = await refreshTokenRepo.findActiveByUserId(userId)

      expect(activeTokens).toHaveLength(1)
      expect(activeTokens[0].tokenHash).toBe(activeTokenHash)
    })

    it('countActiveByUserId - counts active tokens', async () => {
      await refreshTokenRepo.create({
        userId,
        tokenHash: `token-1-${Date.now()}`,
        expiresAt,
      })
      await refreshTokenRepo.create({
        userId,
        tokenHash: `token-2-${Date.now() + 1}`,
        expiresAt,
      })

      const count = await refreshTokenRepo.countActiveByUserId(userId)

      expect(count).toBe(2)
    })
  })
})
