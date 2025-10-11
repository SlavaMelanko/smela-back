import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { ModuleMocker } from '@/__tests__'
import { userRepo } from '@/data'
import env from '@/env'
import { onError } from '@/handlers'
import { signJwt } from '@/jwt'
import { ErrorCode } from '@/lib/catch'
import { Role, Status } from '@/types'

import createDualAuthMiddleware from '../factory'

describe('Dual Auth Middleware Factory - Missing Coverage', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let app: Hono<AppContext>
  let mockUserRepo: any

  const tokenVersion = 1
  const mockUser = {
    id: 123,
    email: 'test@example.com',
    role: Role.User,
    status: Status.Verified,
    tokenVersion,
  }

  beforeEach(async () => {
    app = new Hono<AppContext>()
    app.onError(onError)

    mockUserRepo = {
      findById: mock(async () => mockUser),
    }

    await moduleMocker.mock('@/data', () => ({
      userRepo: mockUserRepo,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('Token Extraction Failures', () => {
    it('should throw Unauthorized when no token is provided', async () => {
      const middleware = createDualAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected')

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
      expect(json.error).toBe('No authentication token provided')
    })

    it('should throw Unauthorized when Authorization header is malformed', async () => {
      const middleware = createDualAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected', {
        headers: {
          Authorization: 'not-bearer-format',
        },
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
    })

    it('should throw Unauthorized when Authorization header has wrong format', async () => {
      const middleware = createDualAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected', {
        headers: {
          Authorization: 'BearerTokenWithoutSpace',
        },
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
    })

    it('should throw Unauthorized when both header and cookie are missing', async () => {
      const middleware = createDualAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected')

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
      expect(json.error).toBe('No authentication token provided')
    })
  })

  describe('Database Lookup Failures', () => {
    it('should throw Unauthorized when user is not found in database', async () => {
      const validToken = await signJwt(mockUser, { secret: env.JWT_ACCESS_SECRET })

      mockUserRepo.findById.mockImplementation(async () => null)

      const middleware = createDualAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
      expect(json.error).toBe('Token version mismatch')
      expect(userRepo.findById).toHaveBeenCalledWith(mockUser.id)
    })

    it('should handle database connection errors gracefully', async () => {
      const validToken = await signJwt(mockUser, { secret: env.JWT_ACCESS_SECRET })

      mockUserRepo.findById.mockImplementation(async () => {
        throw new Error('Database connection failed')
      })

      const middleware = createDualAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
      expect(json.error).toBe('Invalid authentication token')
    })

    it('should handle database timeout errors', async () => {
      const validToken = await signJwt(mockUser, { secret: env.JWT_ACCESS_SECRET })

      mockUserRepo.findById.mockImplementation(async () => {
        throw new Error('Query timeout exceeded')
      })

      const middleware = createDualAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
    })
  })

  describe('Token Version Mismatch Coverage', () => {
    it('should throw Unauthorized when token version is lower than user version', async () => {
      const oldToken = await signJwt(
        { ...mockUser, tokenVersion: 1 },
        { secret: env.JWT_ACCESS_SECRET },
      )

      mockUserRepo.findById.mockImplementation(async () => ({ ...mockUser, tokenVersion: 5 }))

      const middleware = createDualAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${oldToken}`,
        },
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
      expect(json.error).toBe('Token version mismatch')
    })

    it('should throw Unauthorized when token version is higher than user version', async () => {
      const futureToken = await signJwt(
        { ...mockUser, tokenVersion: 10 },
        { secret: env.JWT_ACCESS_SECRET },
      )

      mockUserRepo.findById.mockImplementation(async () => ({ ...mockUser, tokenVersion: 3 }))

      const middleware = createDualAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${futureToken}`,
        },
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
      expect(json.error).toBe('Token version mismatch')
    })

    it('should succeed when token version matches exactly', async () => {
      const validToken = await signJwt(
        { ...mockUser, tokenVersion: 7 },
        { secret: env.JWT_ACCESS_SECRET },
      )

      mockUserRepo.findById.mockImplementation(async () => ({ ...mockUser, tokenVersion: 7 }))

      const middleware = createDualAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.message).toBe('success')
    })
  })

  describe('Error Handling Edge Cases', () => {
    it('should re-throw AppError instances from validators', async () => {
      const validToken = await signJwt(mockUser, { secret: env.JWT_ACCESS_SECRET })

      const middleware = createDualAuthMiddleware(
        () => false, // status validator fails
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })

      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Forbidden)
      expect(json.error).toBe('Status validation failure')
    })

    it('should re-throw AppError from role validator', async () => {
      const validToken = await signJwt(mockUser, { secret: env.JWT_ACCESS_SECRET })

      const middleware = createDualAuthMiddleware(
        () => true,
        () => false, // role validator fails
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })

      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Forbidden)
      expect(json.error).toBe('Role validation failure')
    })

    it('should wrap non-AppError exceptions as Unauthorized', async () => {
      const validToken = await signJwt(mockUser, { secret: env.JWT_ACCESS_SECRET })

      mockUserRepo.findById.mockImplementation(async () => {
        throw new TypeError('Unexpected error')
      })

      const middleware = createDualAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
      expect(json.error).toBe('Invalid authentication token')
    })
  })

  describe('Integration with JWT Verification Errors', () => {
    it('should handle invalid JWT signature', async () => {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'

      const middleware = createDualAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${invalidToken}`,
        },
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
      expect(userRepo.findById).not.toHaveBeenCalled()
    })

    it('should handle expired JWT tokens', async () => {
      const expiredToken = await signJwt(mockUser, {
        secret: env.JWT_ACCESS_SECRET,
        expiresIn: -1,
      })

      const middleware = createDualAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${expiredToken}`,
        },
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
    })

    it('should handle JWT with wrong secret', async () => {
      const tokenWithWrongSecret = await signJwt(mockUser, {
        secret: 'wrong-secret-key',
      })

      const middleware = createDualAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${tokenWithWrongSecret}`,
        },
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
    })
  })

  describe('Successful Authentication Flow', () => {
    it('should successfully authenticate with valid Bearer token', async () => {
      const validToken = await signJwt(mockUser, { secret: env.JWT_ACCESS_SECRET })

      const middleware = createDualAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success', user: c.get('user') }))

      const res = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.message).toBe('success')
      expect(json.user.id).toBe(mockUser.id)
      expect(json.user.email).toBe(mockUser.email)
      expect(userRepo.findById).toHaveBeenCalledWith(mockUser.id)
    })

    it('should set user claims in context for downstream handlers', async () => {
      const validToken = await signJwt(mockUser, { secret: env.JWT_ACCESS_SECRET })

      const middleware = createDualAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', (c) => {
        const user = c.get('user')

        return c.json({
          authenticated: true,
          userId: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          tokenVersion: user.tokenVersion,
        })
      })

      const res = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.authenticated).toBe(true)
      expect(json.userId).toBe(mockUser.id)
      expect(json.email).toBe(mockUser.email)
      expect(json.role).toBe(mockUser.role)
      expect(json.status).toBe(mockUser.status)
      expect(json.tokenVersion).toBe(mockUser.tokenVersion)
    })
  })
})
