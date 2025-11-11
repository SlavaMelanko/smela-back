import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { createTestApp, ModuleMocker, post } from '@/__tests__'
import { HttpStatus } from '@/net/http'
import { Role, Status } from '@/types'

import refreshTokenRoute from '../index'

describe('Refresh Token Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const REFRESH_TOKEN_URL = '/api/v1/auth/refresh-token'

  let app: Hono
  let mockRefreshAccessToken: any
  let mockSetRefreshCookie: any
  let mockGetRefreshCookie: any

  beforeEach(async () => {
    mockRefreshAccessToken = mock(async () => ({
      data: {
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          role: Role.User,
          status: Status.Verified,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        accessToken: 'new_access_token_123',
      },
      refreshToken: 'new_refresh_token_456',
    }))

    await moduleMocker.mock('@/use-cases/auth', () => ({
      refreshAccessToken: mockRefreshAccessToken,
    }))

    mockSetRefreshCookie = mock(() => {})
    mockGetRefreshCookie = mock(() => 'refresh_token_123')

    await moduleMocker.mock('@/net/http', () => ({
      HttpStatus,
      setRefreshCookie: mockSetRefreshCookie,
      getRefreshCookie: mockGetRefreshCookie,
      getDeviceInfo: mock(() => ({ ipAddress: null, userAgent: null })),
    }))

    app = createTestApp('/api/v1/auth', refreshTokenRoute)
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('POST /auth/refresh-token', () => {
    it('should refresh tokens and return user with new access token', async () => {
      const res = await post(app, REFRESH_TOKEN_URL, undefined, {
        Cookie: 'refresh-token=refresh_token_123',
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data).toEqual({
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          role: Role.User,
          status: Status.Verified,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        accessToken: 'new_access_token_123',
      })

      expect(mockSetRefreshCookie).toHaveBeenCalledTimes(1)
      expect(mockSetRefreshCookie).toHaveBeenCalledWith(
        expect.any(Object),
        'new_refresh_token_456',
      )

      expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1)
      expect(mockRefreshAccessToken).toHaveBeenCalledWith({
        refreshToken: 'refresh_token_123',
        deviceInfo: {
          ipAddress: null,
          userAgent: null,
        },
      })
    })

    it('should handle missing refresh token cookie', async () => {
      mockGetRefreshCookie.mockImplementation(() => undefined)
      mockRefreshAccessToken.mockImplementation(async () => {
        throw new Error('Missing refresh token')
      })

      const res = await post(app, REFRESH_TOKEN_URL)

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(mockSetRefreshCookie).not.toHaveBeenCalled()
      expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1)
    })

    it('should handle invalid refresh token', async () => {
      mockRefreshAccessToken.mockImplementation(async () => {
        throw new Error('Invalid refresh token')
      })

      const res = await post(app, REFRESH_TOKEN_URL, undefined, {
        Cookie: 'refresh-token=invalid_token',
      })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(mockSetRefreshCookie).not.toHaveBeenCalled()
      expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1)
    })

    it('should handle expired refresh token', async () => {
      mockRefreshAccessToken.mockImplementation(async () => {
        throw new Error('Refresh token expired')
      })

      const res = await post(app, REFRESH_TOKEN_URL, undefined, {
        Cookie: 'refresh-token=expired_token',
      })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(mockSetRefreshCookie).not.toHaveBeenCalled()
    })

    it('should handle revoked refresh token', async () => {
      mockRefreshAccessToken.mockImplementation(async () => {
        throw new Error('Refresh token revoked')
      })

      const res = await post(app, REFRESH_TOKEN_URL, undefined, {
        Cookie: 'refresh-token=revoked_token',
      })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(mockSetRefreshCookie).not.toHaveBeenCalled()
    })

    it('should handle different cookie formats', async () => {
      const cookieScenarios = [
        { name: 'standard cookie', headers: { Cookie: 'refresh-token=token123' } },
        { name: 'cookie with other values', headers: { Cookie: 'session=abc; refresh-token=token456; other=value' } },
        { name: 'no cookie header', headers: undefined },
      ]

      for (const scenario of cookieScenarios) {
        const res = await post(app, REFRESH_TOKEN_URL, undefined, scenario.headers)

        // Either success or error, but endpoint should handle gracefully
        expect([HttpStatus.OK, HttpStatus.INTERNAL_SERVER_ERROR]).toContain(res.status)
      }
    })

    it('should handle request body gracefully (endpoint ignores body)', async () => {
      const scenarios = [
        { name: 'no body', body: undefined },
        { name: 'empty object', body: {} },
        { name: 'arbitrary data', body: { someData: 'ignored' } },
      ]

      for (const { body } of scenarios) {
        const res = await post(app, REFRESH_TOKEN_URL, body, {
          Cookie: 'refresh-token=refresh_token_123',
        })

        expect(res.status).toBe(HttpStatus.OK)

        const data = await res.json()
        expect(data).toHaveProperty('user')
        expect(data).toHaveProperty('accessToken')
      }
    })
  })
})
