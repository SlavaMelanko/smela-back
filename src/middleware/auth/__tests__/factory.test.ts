import { beforeEach, describe, expect, it } from 'bun:test'
import { Hono } from 'hono'

import type { AppContext } from '@/context'

import env from '@/env'
import { ErrorCode } from '@/errors'
import { onError } from '@/handlers'
import HttpStatus from '@/net/http/status'
import { signJwt } from '@/security/jwt'
import { Role, Status } from '@/types'

import createAuthMiddleware from '../factory'

describe('Auth Middleware Factory - Missing Coverage', () => {
  let app: Hono<AppContext>

  const mockUser = {
    id: 123,
    email: 'test@example.com',
    role: Role.User,
    status: Status.Verified,
  }

  beforeEach(() => {
    app = new Hono<AppContext>()
    app.onError(onError)
  })

  describe('Token Extraction Failures', () => {
    it('should throw Unauthorized when no token is provided', async () => {
      const middleware = createAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected')

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
      expect(json.error).toBe('No authentication token provided')
    })

    it('should throw Unauthorized when Authorization header is malformed', async () => {
      const middleware = createAuthMiddleware(
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

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
    })

    it('should throw Unauthorized when Authorization header has wrong format', async () => {
      const middleware = createAuthMiddleware(
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

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
    })

    it('should throw Unauthorized when both header and cookie are missing', async () => {
      const middleware = createAuthMiddleware(
        () => true,
        () => true,
      )

      app.use('/protected', middleware)
      app.get('/protected', c => c.json({ message: 'success' }))

      const res = await app.request('/protected')

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
      expect(json.error).toBe('No authentication token provided')
    })
  })

  describe('Error Handling Edge Cases', () => {
    it('should re-throw AppError instances from validators', async () => {
      const validToken = await signJwt(mockUser, { secret: env.JWT_ACCESS_SECRET })

      const middleware = createAuthMiddleware(
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

      expect(res.status).toBe(HttpStatus.FORBIDDEN)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Forbidden)
      expect(json.error).toBe('Status validation failure')
    })

    it('should re-throw AppError from role validator', async () => {
      const validToken = await signJwt(mockUser, { secret: env.JWT_ACCESS_SECRET })

      const middleware = createAuthMiddleware(
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

      expect(res.status).toBe(HttpStatus.FORBIDDEN)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Forbidden)
      expect(json.error).toBe('Role validation failure')
    })
  })

  describe('Integration with JWT Verification Errors', () => {
    it('should handle invalid JWT signature', async () => {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'

      const middleware = createAuthMiddleware(
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

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
    })

    it('should handle expired JWT tokens', async () => {
      const expiredToken = await signJwt(mockUser, {
        secret: env.JWT_ACCESS_SECRET,
        expiresIn: -1,
      })

      const middleware = createAuthMiddleware(
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

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
    })

    it('should handle JWT with wrong secret', async () => {
      const tokenWithWrongSecret = await signJwt(mockUser, {
        secret: 'wrong-secret-key',
      })

      const middleware = createAuthMiddleware(
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

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
    })
  })

  describe('Successful Authentication Flow', () => {
    it('should successfully authenticate with valid Bearer token', async () => {
      const validToken = await signJwt(mockUser, { secret: env.JWT_ACCESS_SECRET })

      const middleware = createAuthMiddleware(
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

      expect(res.status).toBe(HttpStatus.OK)
      const json = await res.json()
      expect(json.message).toBe('success')
      expect(json.user.id).toBe(mockUser.id)
      expect(json.user.email).toBe(mockUser.email)
    })

    it('should set user claims in context for downstream handlers', async () => {
      const validToken = await signJwt(mockUser, { secret: env.JWT_ACCESS_SECRET })

      const middleware = createAuthMiddleware(
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
        })
      })

      const res = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })

      expect(res.status).toBe(HttpStatus.OK)
      const json = await res.json()
      expect(json.authenticated).toBe(true)
      expect(json.userId).toBe(mockUser.id)
      expect(json.email).toBe(mockUser.email)
      expect(json.role).toBe(mockUser.role)
      expect(json.status).toBe(mockUser.status)
    })
  })
})
