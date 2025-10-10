import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { ZodError } from 'zod'

import { ModuleMocker } from '@/__tests__'
import { AppError, ErrorCode } from '@/lib/catch'
import { Role, Status } from '@/types'

describe('JWT', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockSign: any
  let mockVerify: any
  let mockParsePayload: any

  describe('signJwt', () => {
    let signJwt: any

    beforeEach(async () => {
      mockSign = mock(async () => 'mock-jwt-token')

      await moduleMocker.mock('hono/jwt', () => ({
        sign: mockSign,
        verify: mock(),
      }))

      const jwt = await import('../jwt')
      signJwt = jwt.signJwt
    })

    afterEach(async () => {
      await moduleMocker.clear()
    })

    it('should create JWT token with correct payload', async () => {
      const token = await signJwt(
        {
          id: 1,
          email: 'test@example.com',
          role: Role.User,
          status: Status.Active,
          tokenVersion: 0,
        },
        { secret: 'test-secret' },
      )

      expect(token).toBe('mock-jwt-token')
      expect(mockSign).toHaveBeenCalledTimes(1)

      const [payload] = mockSign.mock.calls[0]
      expect(payload).toMatchObject({
        id: 1,
        email: 'test@example.com',
        role: Role.User,
        status: Status.Active,
        v: 0,
      })
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })

    it('should include token version in payload', async () => {
      await signJwt(
        {
          id: 1,
          email: 'test@example.com',
          role: Role.User,
          status: Status.Active,
          tokenVersion: 5,
        },
        { secret: 'test-secret' },
      )

      const [payload] = mockSign.mock.calls[0]
      expect(payload.v).toBe(5)
    })

    it('should set expiration timestamp', async () => {
      const beforeExp = Math.floor(Date.now() / 1000)
      await signJwt(
        {
          id: 1,
          email: 'test@example.com',
          role: Role.User,
          status: Status.Active,
          tokenVersion: 0,
        },
        { secret: 'test-secret' },
      )
      const afterExp = Math.floor(Date.now() / 1000)

      const [payload] = mockSign.mock.calls[0]
      expect(payload.exp).toBeGreaterThanOrEqual(beforeExp)
      expect(payload.exp).toBeLessThanOrEqual(afterExp + 3600)
    })

    it('should use custom secret when provided in options', async () => {
      const customSecret = 'custom-secret-key'

      await signJwt(
        {
          id: 1,
          email: 'test@example.com',
          role: Role.User,
          status: Status.Active,
          tokenVersion: 0,
        },
        { secret: customSecret },
      )

      expect(mockSign).toHaveBeenCalledWith(expect.any(Object), customSecret)
    })

    it('should use custom expiration time when provided in options', async () => {
      const customExpiresIn = 7200 // 2 hours
      const beforeExp = Math.floor(Date.now() / 1000)

      await signJwt(
        {
          id: 1,
          email: 'test@example.com',
          role: Role.User,
          status: Status.Active,
          tokenVersion: 0,
        },
        { expiresIn: customExpiresIn },
      )

      const [payload] = mockSign.mock.calls[0]
      expect(payload.exp).toBeGreaterThanOrEqual(beforeExp + customExpiresIn)
      expect(payload.exp).toBeLessThanOrEqual(beforeExp + customExpiresIn + 1)
    })

    it('should use both custom secret and expiration when provided', async () => {
      const customSecret = 'another-secret'
      const customExpiresIn = 1800 // 30 minutes

      await signJwt(
        {
          id: 1,
          email: 'test@example.com',
          role: Role.User,
          status: Status.Active,
          tokenVersion: 0,
        },
        { secret: customSecret, expiresIn: customExpiresIn },
      )

      const [payload, secret] = mockSign.mock.calls[0]
      expect(secret).toBe(customSecret)
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })
  })

  describe('verifyJwt', () => {
    let verifyJwt: any

    beforeEach(async () => {
      mockVerify = mock(async () => ({
        id: 1,
        email: 'test@example.com',
        role: Role.User,
        status: Status.Active,
        v: 0,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }))

      await moduleMocker.mock('hono/jwt', () => ({
        sign: mock(),
        verify: mockVerify,
      }))

      mockParsePayload = mock((payload: unknown) => payload)

      await moduleMocker.mock('@/jwt/payload', () => ({
        parse: mockParsePayload,
      }))

      const jwt = await import('../jwt')
      verifyJwt = jwt.verifyJwt
    })

    afterEach(async () => {
      await moduleMocker.clear()
    })

    it('should verify and parse valid JWT token', async () => {
      const payload = await verifyJwt('valid-token', { secret: 'test-secret' })

      expect(mockVerify).toHaveBeenCalledWith('valid-token', 'test-secret')
      expect(mockParsePayload).toHaveBeenCalledTimes(1)
      expect(payload).toMatchObject({
        id: 1,
        email: 'test@example.com',
        role: Role.User,
        status: Status.Active,
        v: 0,
      })
    })

    it('should throw Unauthorized error for invalid token', async () => {
      mockVerify.mockImplementation(async () => {
        throw new Error('Invalid token')
      })

      expect(verifyJwt('invalid-token', { secret: 'test-secret' })).rejects.toThrow(AppError)
      expect(verifyJwt('invalid-token', { secret: 'test-secret' })).rejects.toMatchObject({
        code: ErrorCode.Unauthorized,
        message: 'Invalid authentication token',
      })
    })

    it('should throw Unauthorized error for invalid payload structure', async () => {
      mockParsePayload.mockImplementation(() => {
        throw new ZodError([])
      })

      expect(verifyJwt('token-with-bad-payload', { secret: 'test-secret' })).rejects.toThrow(AppError)
      expect(verifyJwt('token-with-bad-payload', { secret: 'test-secret' })).rejects.toMatchObject({
        code: ErrorCode.Unauthorized,
        message: 'Invalid token payload structure',
      })
    })

    it('should handle expired tokens', async () => {
      mockVerify.mockImplementation(async () => {
        throw new Error('Token expired')
      })

      expect(verifyJwt('expired-token', { secret: 'test-secret' })).rejects.toThrow(AppError)
      expect(verifyJwt('expired-token', { secret: 'test-secret' })).rejects.toMatchObject({
        code: ErrorCode.Unauthorized,
      })
    })
  })
})
