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
      const token = await signJwt(1, 'test@example.com', Role.User, Status.Active, 0)

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
      await signJwt(1, 'test@example.com', Role.User, Status.Active, 5)

      const [payload] = mockSign.mock.calls[0]
      expect(payload.v).toBe(5)
    })

    it('should set expiration timestamp', async () => {
      const beforeExp = Math.floor(Date.now() / 1000)
      await signJwt(1, 'test@example.com', Role.User, Status.Active, 0)
      const afterExp = Math.floor(Date.now() / 1000)

      const [payload] = mockSign.mock.calls[0]
      expect(payload.exp).toBeGreaterThanOrEqual(beforeExp)
      expect(payload.exp).toBeLessThanOrEqual(afterExp + 3600)
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

      await moduleMocker.mock('@/lib/jwt/payload', () => ({
        parsePayload: mockParsePayload,
      }))

      const jwt = await import('../jwt')
      verifyJwt = jwt.verifyJwt
    })

    afterEach(async () => {
      await moduleMocker.clear()
    })

    it('should verify and parse valid JWT token', async () => {
      const payload = await verifyJwt('valid-token')

      expect(mockVerify).toHaveBeenCalledWith('valid-token', expect.any(String))
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

      expect(verifyJwt('invalid-token')).rejects.toThrow(AppError)
      expect(verifyJwt('invalid-token')).rejects.toMatchObject({
        code: ErrorCode.Unauthorized,
        message: 'Invalid authentication token',
      })
    })

    it('should throw Unauthorized error for invalid payload structure', async () => {
      mockParsePayload.mockImplementation(() => {
        throw new ZodError([])
      })

      expect(verifyJwt('token-with-bad-payload')).rejects.toThrow(AppError)
      expect(verifyJwt('token-with-bad-payload')).rejects.toMatchObject({
        code: ErrorCode.Unauthorized,
        message: 'Invalid token payload structure',
      })
    })

    it('should handle expired tokens', async () => {
      mockVerify.mockImplementation(async () => {
        throw new Error('Token expired')
      })

      expect(verifyJwt('expired-token')).rejects.toThrow(AppError)
      expect(verifyJwt('expired-token')).rejects.toMatchObject({
        code: ErrorCode.Unauthorized,
      })
    })
  })
})
