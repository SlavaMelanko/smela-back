import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { ZodError } from 'zod'

import { ModuleMocker, testUuids } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { Role, Status } from '@/types'
import { nowInSeconds } from '@/utils/chrono'

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
          id: testUuids.USER_1,
          email: 'test@example.com',
          role: Role.User,
          status: Status.Active,
        },
        { secret: 'test-secret' },
      )

      expect(mockSign).toHaveBeenCalledTimes(1)

      const [payload] = mockSign.mock.calls[0]
      const now = nowInSeconds()

      expect(payload).toMatchObject({
        id: testUuids.USER_1,
        email: 'test@example.com',
        role: Role.User,
        status: Status.Active,
      })
      expect(payload.iat).toBeGreaterThanOrEqual(now - 1)
      expect(payload.nbf).toBeGreaterThanOrEqual(now - 1)
      expect(payload.exp).toBeGreaterThan(now)
    })
  })

  describe('verifyJwt', () => {
    let verifyJwt: any

    beforeEach(async () => {
      mockVerify = mock(async () => ({
        id: testUuids.USER_1,
        email: 'test@example.com',
        role: Role.User,
        status: Status.Active,
        exp: nowInSeconds() + 3600,
      }))

      await moduleMocker.mock('hono/jwt', () => ({
        sign: mock(),
        verify: mockVerify,
      }))

      mockParsePayload = mock((payload: unknown) => payload)

      await moduleMocker.mock('@/security/jwt/payload', () => ({
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

    describe('Secret Rotation', () => {
      it('should verify token with current secret successfully', async () => {
        const mockPayload = {
          id: testUuids.USER_1,
          email: 'test@example.com',
          role: Role.User,
          status: Status.Active,
          exp: nowInSeconds() + 3600,
        }

        mockVerify.mockImplementation(async (token: string, secret: string) => {
          if (secret === 'current-secret-key') {
            return mockPayload
          }
          throw new Error('Invalid signature')
        })

        mockParsePayload.mockImplementation((payload: unknown) => ({
          userClaims: payload,
        }))

        const result = await verifyJwt('valid-token', {
          secret: 'current-secret-key',
          previousSecret: 'previous-secret-key',
        })

        expect(result).toEqual(mockPayload)
        expect(mockVerify).toHaveBeenCalledTimes(1)
        expect(mockVerify).toHaveBeenCalledWith('valid-token', 'current-secret-key', 'HS256')
      })

      it('should fallback to previous secret when current secret fails', async () => {
        const mockPayload = {
          id: testUuids.USER_1,
          email: 'test@example.com',
          role: Role.User,
          status: Status.Active,
          exp: nowInSeconds() + 3600,
        }

        // First call (current secret) fails, second call (previous secret) succeeds
        mockVerify
          .mockImplementationOnce(async () => {
            throw new Error('Invalid signature')
          })
          .mockImplementationOnce(async () => mockPayload)

        mockParsePayload.mockImplementation((payload: unknown) => ({
          userClaims: payload,
        }))

        const result = await verifyJwt('old-token', {
          secret: 'current-secret-key',
          previousSecret: 'previous-secret-key',
        })

        expect(result).toEqual(mockPayload)
        expect(mockVerify).toHaveBeenCalledTimes(2)
        expect(mockVerify).toHaveBeenNthCalledWith(1, 'old-token', 'current-secret-key', 'HS256')
        expect(mockVerify).toHaveBeenNthCalledWith(2, 'old-token', 'previous-secret-key', 'HS256')
      })

      it('should throw Unauthorized when both current and previous secrets fail', async () => {
        mockVerify.mockImplementation(async () => {
          throw new Error('Invalid signature')
        })

        expect(
          verifyJwt('invalid-token', {
            secret: 'current-secret-key',
            previousSecret: 'previous-secret-key',
          }),
        ).rejects.toThrow(AppError)
        expect(
          verifyJwt('invalid-token', {
            secret: 'current-secret-key',
            previousSecret: 'previous-secret-key',
          }),
        ).rejects.toMatchObject({
          code: ErrorCode.Unauthorized,
          message: 'Invalid authentication token',
        })

        // 2 calls per rejects check (current + previous for each)
        expect(mockVerify).toHaveBeenCalledTimes(4)
      })

      it('should throw Unauthorized when current secret fails and no previous secret exists', async () => {
        mockVerify.mockImplementation(async () => {
          throw new Error('Invalid signature')
        })

        expect(
          verifyJwt('invalid-token', { secret: 'current-secret-key' }),
        ).rejects.toThrow(AppError)
        expect(
          verifyJwt('invalid-token', { secret: 'current-secret-key' }),
        ).rejects.toMatchObject({
          code: ErrorCode.Unauthorized,
          message: 'Invalid authentication token',
        })

        // Should only try current secret once per rejects check
        expect(mockVerify).toHaveBeenCalledTimes(2)
      })
    })
  })
})
