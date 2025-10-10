import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { ZodError } from 'zod'

import { ModuleMocker } from '@/__tests__'
import { AppError, ErrorCode } from '@/lib/catch'
import { Role, Status } from '@/types'

describe('JWT Unit Tests', () => {
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

    it('should transform user claims to JWT payload format', async () => {
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

      expect(mockSign).toHaveBeenCalledTimes(1)

      const [payload] = mockSign.mock.calls[0]
      expect(payload).toMatchObject({
        id: 1,
        email: 'test@example.com',
        role: Role.User,
        status: Status.Active,
        v: 5,
      })
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

    it('should throw Unauthorized error for JWT verification failure', async () => {
      mockVerify.mockImplementation(async () => {
        throw new Error('JWT verification failed')
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
        message: 'Invalid authentication token',
      })
    })
  })
})
