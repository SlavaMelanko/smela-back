import type { Context } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker } from '@/__tests__'
import { HttpStatus } from '@/net/http'

import logoutHandler from '../handler'

describe('Logout Handler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: Context
  let mockBody: any

  let mockRefreshToken: string
  let mockGetRefreshCookie: any
  let mockDeleteRefreshCookie: any

  let mockLogout: any

  beforeEach(async () => {
    // Mock context and response
    mockBody = mock((body: any, status: number) => ({ body, status }))
    mockContext = {
      body: mockBody,
    } as any

    // @/net/http module group
    mockRefreshToken = 'refresh_token_123'
    mockGetRefreshCookie = mock(() => mockRefreshToken)
    mockDeleteRefreshCookie = mock(() => {})

    await moduleMocker.mock('@/net/http', () => ({
      getRefreshCookie: mockGetRefreshCookie,
      deleteRefreshCookie: mockDeleteRefreshCookie,
      HttpStatus,
    }))

    // @/use-cases/auth/logout module group
    mockLogout = mock(async () => {})

    await moduleMocker.mock('@/use-cases/auth/logout', () => ({
      logout: mockLogout,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('successful logout', () => {
    it('should logout user and return 204 No Content when refresh token exists', async () => {
      const result = await logoutHandler(mockContext)

      expect(mockGetRefreshCookie).toHaveBeenCalledWith(mockContext)
      expect(mockLogout).toHaveBeenCalledWith(mockRefreshToken)
      expect(mockDeleteRefreshCookie).toHaveBeenCalledWith(mockContext)
      expect(mockBody).toHaveBeenCalledWith(null, HttpStatus.NO_CONTENT)
      expect(result.body).toBe(null)
      expect(result.status).toBe(HttpStatus.NO_CONTENT)
    })

    it('should handle logout when no refresh token exists', async () => {
      mockGetRefreshCookie.mockImplementation(() => undefined)

      const result = await logoutHandler(mockContext)

      expect(mockGetRefreshCookie).toHaveBeenCalledWith(mockContext)
      expect(mockLogout).toHaveBeenCalledWith(undefined)
      expect(mockDeleteRefreshCookie).toHaveBeenCalledWith(mockContext)
      expect(mockBody).toHaveBeenCalledWith(null, HttpStatus.NO_CONTENT)
      expect(result.body).toBe(null)
      expect(result.status).toBe(HttpStatus.NO_CONTENT)
    })

    it('should handle logout when refresh token is empty string', async () => {
      mockGetRefreshCookie.mockImplementation(() => '')

      const result = await logoutHandler(mockContext)

      expect(mockGetRefreshCookie).toHaveBeenCalledWith(mockContext)
      expect(mockLogout).toHaveBeenCalledWith('')
      expect(mockDeleteRefreshCookie).toHaveBeenCalledWith(mockContext)
      expect(mockBody).toHaveBeenCalledWith(null, HttpStatus.NO_CONTENT)
      expect(result.body).toBe(null)
      expect(result.status).toBe(HttpStatus.NO_CONTENT)
    })
  })

  describe('error handling', () => {
    it('should propagate error when logout use case throws', async () => {
      const logoutError = new Error('Token revocation failed')
      mockLogout.mockImplementation(async () => {
        throw logoutError
      })

      expect(logoutHandler(mockContext)).rejects.toThrow('Token revocation failed')

      expect(mockGetRefreshCookie).toHaveBeenCalledWith(mockContext)
      expect(mockLogout).toHaveBeenCalledWith(mockRefreshToken)
      // Cookie deletion should not be called if logout throws
      expect(mockDeleteRefreshCookie).not.toHaveBeenCalled()
      expect(mockBody).not.toHaveBeenCalled()
    })

    it('should propagate error when getRefreshCookie throws', async () => {
      const cookieError = new Error('Cookie parsing failed')
      mockGetRefreshCookie.mockImplementation(() => {
        throw cookieError
      })

      expect(logoutHandler(mockContext)).rejects.toThrow('Cookie parsing failed')

      expect(mockGetRefreshCookie).toHaveBeenCalledWith(mockContext)
      expect(mockLogout).not.toHaveBeenCalled()
      expect(mockDeleteRefreshCookie).not.toHaveBeenCalled()
      expect(mockBody).not.toHaveBeenCalled()
    })

    it('should propagate error when deleteRefreshCookie throws', async () => {
      const deleteCookieError = new Error('Cookie deletion failed')
      mockDeleteRefreshCookie.mockImplementation(() => {
        throw deleteCookieError
      })

      expect(logoutHandler(mockContext)).rejects.toThrow('Cookie deletion failed')

      expect(mockGetRefreshCookie).toHaveBeenCalledWith(mockContext)
      expect(mockLogout).toHaveBeenCalledWith(mockRefreshToken)
      expect(mockDeleteRefreshCookie).toHaveBeenCalledWith(mockContext)
      expect(mockBody).not.toHaveBeenCalled()
    })
  })

  describe('function call order', () => {
    it('should execute operations in correct sequence', async () => {
      const callOrder: string[] = []

      mockGetRefreshCookie.mockImplementation(() => {
        callOrder.push('getRefreshCookie')

        return mockRefreshToken
      })

      mockLogout.mockImplementation(async () => {
        callOrder.push('logout')
      })

      mockDeleteRefreshCookie.mockImplementation(() => {
        callOrder.push('deleteRefreshCookie')
      })

      mockBody.mockImplementation(() => {
        callOrder.push('body')

        return { body: null, status: HttpStatus.NO_CONTENT }
      })

      await logoutHandler(mockContext)

      expect(callOrder).toEqual([
        'getRefreshCookie',
        'logout',
        'deleteRefreshCookie',
        'body',
      ])
    })

    it('should stop execution at logout failure', async () => {
      const callOrder: string[] = []

      mockGetRefreshCookie.mockImplementation(() => {
        callOrder.push('getRefreshCookie')

        return mockRefreshToken
      })

      mockLogout.mockImplementation(async () => {
        callOrder.push('logout')
        throw new Error('Logout failed')
      })

      mockDeleteRefreshCookie.mockImplementation(() => {
        callOrder.push('deleteRefreshCookie')
      })

      mockBody.mockImplementation(() => {
        callOrder.push('body')

        return { body: null, status: HttpStatus.NO_CONTENT }
      })

      expect(logoutHandler(mockContext)).rejects.toThrow('Logout failed')

      expect(callOrder).toEqual(['getRefreshCookie', 'logout'])
    })
  })

  describe('edge cases', () => {
    it('should handle various refresh token formats', async () => {
      const tokenFormats = [
        'simple_token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'token-with-dashes',
        'token_with_underscores',
        'token.with.dots',
        'UPPERCASE_TOKEN',
        'MiXeD_CaSe_ToKeN',
        'token123456789',
        'a'.repeat(100), // very long token
        'special!@#$%^&*()token',
      ]

      for (const token of tokenFormats) {
        mockGetRefreshCookie.mockImplementation(() => token)

        const result = await logoutHandler(mockContext)

        expect(mockLogout).toHaveBeenCalledWith(token)
        expect(result.body).toBe(null)
        expect(result.status).toBe(HttpStatus.NO_CONTENT)
      }

      expect(mockLogout).toHaveBeenCalledTimes(tokenFormats.length)
      expect(mockDeleteRefreshCookie).toHaveBeenCalledTimes(tokenFormats.length)
    })

    it('should handle null and undefined refresh tokens', async () => {
      const nullishValues = [null, undefined]

      for (const value of nullishValues) {
        mockGetRefreshCookie.mockImplementation(() => value)

        const result = await logoutHandler(mockContext)

        expect(mockLogout).toHaveBeenCalledWith(value)
        expect(result.body).toBe(null)
        expect(result.status).toBe(HttpStatus.NO_CONTENT)
      }

      expect(mockLogout).toHaveBeenCalledTimes(nullishValues.length)
      expect(mockDeleteRefreshCookie).toHaveBeenCalledTimes(nullishValues.length)
    })
  })

  describe('context dependency', () => {
    it('should pass the same context to cookie operations', async () => {
      await logoutHandler(mockContext)

      expect(mockGetRefreshCookie).toHaveBeenCalledWith(mockContext)
      expect(mockDeleteRefreshCookie).toHaveBeenCalledWith(mockContext)
    })

    it('should use context body method for response', async () => {
      await logoutHandler(mockContext)

      expect(mockContext.body).toHaveBeenCalledWith(null, HttpStatus.NO_CONTENT)
    })
  })
})
