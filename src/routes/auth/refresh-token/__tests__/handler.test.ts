import type { Context } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker } from '@/__tests__'
import { HttpStatus } from '@/net/http'
import { Role, Status } from '@/types'

import refreshTokenHandler from '../handler'

describe('Refresh Token Handler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: Context
  let mockJson: any

  let mockRefreshToken: string
  let mockGetRefreshCookie: any
  let mockSetRefreshCookie: any
  let mockGetDeviceInfo: any

  let mockRefreshAccessToken: any

  beforeEach(async () => {
    // Mock context and response
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      json: mockJson,
    } as any

    // @/net/http module group
    mockRefreshToken = 'refresh_token_123'
    mockGetRefreshCookie = mock(() => mockRefreshToken)
    mockSetRefreshCookie = mock(() => {})
    mockGetDeviceInfo = mock(() => ({
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Test)',
    }))

    await moduleMocker.mock('@/net/http', () => ({
      getRefreshCookie: mockGetRefreshCookie,
      setRefreshCookie: mockSetRefreshCookie,
      getDeviceInfo: mockGetDeviceInfo,
      HttpStatus,
    }))

    // @/use-cases/auth module group
    mockRefreshAccessToken = mock(async () => ({
      data: {
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          status: Status.Verified,
          role: Role.User,
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
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('successful token refresh', () => {
    it('should refresh tokens and return user data with new access token', async () => {
      const result = await refreshTokenHandler(mockContext)

      expect(mockGetRefreshCookie).toHaveBeenCalledWith(mockContext)
      expect(mockGetDeviceInfo).toHaveBeenCalledWith(mockContext)
      expect(mockRefreshAccessToken).toHaveBeenCalledWith({
        refreshToken: mockRefreshToken,
        deviceInfo: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Test)',
        },
      })
      expect(mockSetRefreshCookie).toHaveBeenCalledWith(mockContext, 'new_refresh_token_456')
      expect(mockJson).toHaveBeenCalledWith({
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          status: Status.Verified,
          role: Role.User,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        accessToken: 'new_access_token_123',
      }, HttpStatus.OK)
      expect(result.status).toBe(HttpStatus.OK)
    })

    it('should handle device info with null values', async () => {
      mockGetDeviceInfo.mockImplementation(() => ({
        ipAddress: null,
        userAgent: null,
      }))

      const result = await refreshTokenHandler(mockContext)

      expect(mockRefreshAccessToken).toHaveBeenCalledWith({
        refreshToken: mockRefreshToken,
        deviceInfo: {
          ipAddress: null,
          userAgent: null,
        },
      })
      expect(result.status).toBe(HttpStatus.OK)
    })
  })

  describe('error handling', () => {
    it('should propagate error when refresh token is missing', async () => {
      mockGetRefreshCookie.mockImplementation(() => undefined)
      mockRefreshAccessToken.mockImplementation(async () => {
        throw new Error('Missing refresh token')
      })

      expect(refreshTokenHandler(mockContext)).rejects.toThrow('Missing refresh token')

      expect(mockGetRefreshCookie).toHaveBeenCalledWith(mockContext)
      expect(mockRefreshAccessToken).toHaveBeenCalledWith({
        refreshToken: undefined,
        deviceInfo: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Test)',
        },
      })
      expect(mockSetRefreshCookie).not.toHaveBeenCalled()
      expect(mockJson).not.toHaveBeenCalled()
    })

    it('should propagate error when refresh token is invalid', async () => {
      mockRefreshAccessToken.mockImplementation(async () => {
        throw new Error('Invalid refresh token')
      })

      expect(refreshTokenHandler(mockContext)).rejects.toThrow('Invalid refresh token')

      expect(mockRefreshAccessToken).toHaveBeenCalled()
      expect(mockSetRefreshCookie).not.toHaveBeenCalled()
      expect(mockJson).not.toHaveBeenCalled()
    })

    it('should propagate error when refresh token is expired', async () => {
      mockRefreshAccessToken.mockImplementation(async () => {
        throw new Error('Refresh token expired')
      })

      expect(refreshTokenHandler(mockContext)).rejects.toThrow('Refresh token expired')

      expect(mockSetRefreshCookie).not.toHaveBeenCalled()
      expect(mockJson).not.toHaveBeenCalled()
    })

    it('should propagate error when getRefreshCookie throws', async () => {
      mockGetRefreshCookie.mockImplementation(() => {
        throw new Error('Cookie parsing failed')
      })

      expect(refreshTokenHandler(mockContext)).rejects.toThrow('Cookie parsing failed')

      expect(mockGetRefreshCookie).toHaveBeenCalledWith(mockContext)
      expect(mockRefreshAccessToken).not.toHaveBeenCalled()
      expect(mockSetRefreshCookie).not.toHaveBeenCalled()
      expect(mockJson).not.toHaveBeenCalled()
    })

    it('should propagate error when setRefreshCookie throws', async () => {
      mockSetRefreshCookie.mockImplementation(() => {
        throw new Error('Cookie setting failed')
      })

      expect(refreshTokenHandler(mockContext)).rejects.toThrow('Cookie setting failed')

      expect(mockRefreshAccessToken).toHaveBeenCalled()
      expect(mockSetRefreshCookie).toHaveBeenCalled()
      expect(mockJson).not.toHaveBeenCalled()
    })
  })

  describe('function call order', () => {
    it('should execute operations in correct sequence', async () => {
      const callOrder: string[] = []

      mockGetRefreshCookie.mockImplementation(() => {
        callOrder.push('getRefreshCookie')

        return mockRefreshToken
      })

      mockGetDeviceInfo.mockImplementation(() => {
        callOrder.push('getDeviceInfo')

        return { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0 (Test)' }
      })

      mockRefreshAccessToken.mockImplementation(async () => {
        callOrder.push('refreshAccessToken')

        return {
          data: {
            user: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
              email: 'test@example.com',
              status: Status.Verified,
              role: Role.User,
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
            accessToken: 'new_access_token_123',
          },
          refreshToken: 'new_refresh_token_456',
        }
      })

      mockSetRefreshCookie.mockImplementation(() => {
        callOrder.push('setRefreshCookie')
      })

      mockJson.mockImplementation(() => {
        callOrder.push('json')

        return { data: {}, status: HttpStatus.OK }
      })

      await refreshTokenHandler(mockContext)

      expect(callOrder).toEqual([
        'getRefreshCookie',
        'getDeviceInfo',
        'refreshAccessToken',
        'setRefreshCookie',
        'json',
      ])
    })

    it('should stop execution at refreshAccessToken failure', async () => {
      const callOrder: string[] = []

      mockGetRefreshCookie.mockImplementation(() => {
        callOrder.push('getRefreshCookie')

        return mockRefreshToken
      })

      mockGetDeviceInfo.mockImplementation(() => {
        callOrder.push('getDeviceInfo')

        return { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0 (Test)' }
      })

      mockRefreshAccessToken.mockImplementation(async () => {
        callOrder.push('refreshAccessToken')
        throw new Error('Token refresh failed')
      })

      mockSetRefreshCookie.mockImplementation(() => {
        callOrder.push('setRefreshCookie')
      })

      mockJson.mockImplementation(() => {
        callOrder.push('json')

        return { data: {}, status: HttpStatus.OK }
      })

      expect(refreshTokenHandler(mockContext)).rejects.toThrow('Token refresh failed')

      expect(callOrder).toEqual(['getRefreshCookie', 'getDeviceInfo', 'refreshAccessToken'])
    })
  })

  describe('context dependency', () => {
    it('should use context for all cookie and device operations', async () => {
      await refreshTokenHandler(mockContext)

      expect(mockGetRefreshCookie).toHaveBeenCalledWith(mockContext)
      expect(mockGetDeviceInfo).toHaveBeenCalledWith(mockContext)
      expect(mockSetRefreshCookie).toHaveBeenCalledWith(mockContext, 'new_refresh_token_456')
      expect(mockContext.json).toHaveBeenCalledWith(expect.any(Object), HttpStatus.OK)
    })
  })
})
