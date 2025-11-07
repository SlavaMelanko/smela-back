import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker } from '@/__tests__'

import { logout } from '../logout'

describe('Logout Use Case', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockRefreshTokenRepo: any

  let mockTokenHash: string
  let mockHashToken: any

  beforeEach(async () => {
    // @/data module group
    mockRefreshTokenRepo = {
      revokeByHash: mock(async () => {}),
    }

    await moduleMocker.mock('@/data', () => ({
      refreshTokenRepo: mockRefreshTokenRepo,
    }))

    // @/security/token module group
    mockTokenHash = 'hashed_token_123'
    mockHashToken = mock(async () => mockTokenHash)

    await moduleMocker.mock('@/security/token', () => ({
      hashToken: mockHashToken,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('successful logout', () => {
    it('should revoke token when valid refresh token provided', async () => {
      const refreshToken = 'valid_refresh_token'

      await logout(refreshToken)

      expect(mockHashToken).toHaveBeenCalledWith(refreshToken)
      expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledWith(mockTokenHash)
    })

    it('should handle different token formats', async () => {
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
        await logout(token)

        expect(mockHashToken).toHaveBeenCalledWith(token)
        expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledWith(mockTokenHash)
      }

      expect(mockHashToken).toHaveBeenCalledTimes(tokenFormats.length)
      expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledTimes(tokenFormats.length)
    })
  })

  describe('early return scenarios', () => {
    it('should return early when refresh token is undefined', async () => {
      await logout(undefined)

      expect(mockHashToken).not.toHaveBeenCalled()
      expect(mockRefreshTokenRepo.revokeByHash).not.toHaveBeenCalled()
    })

    it('should return early when refresh token is null', async () => {
      await logout(null as any)

      expect(mockHashToken).not.toHaveBeenCalled()
      expect(mockRefreshTokenRepo.revokeByHash).not.toHaveBeenCalled()
    })

    it('should return early when refresh token is empty string', async () => {
      await logout('')

      expect(mockHashToken).not.toHaveBeenCalled()
      expect(mockRefreshTokenRepo.revokeByHash).not.toHaveBeenCalled()
    })

    it('should handle whitespace-only tokens as empty', async () => {
      const whitespaceTokens = [' ', '  ', '\t', '\n', '\r', '   \t\n\r   ']

      for (const token of whitespaceTokens) {
        await logout(token)

        // These should not trigger early return since they are truthy strings
        expect(mockHashToken).toHaveBeenCalledWith(token)
        expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledWith(mockTokenHash)
      }

      expect(mockHashToken).toHaveBeenCalledTimes(whitespaceTokens.length)
      expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledTimes(whitespaceTokens.length)
    })
  })

  describe('error handling', () => {
    it('should propagate error when token hashing fails', async () => {
      const hashError = new Error('Token hashing failed')
      mockHashToken.mockImplementation(async () => {
        throw hashError
      })

      const refreshToken = 'valid_refresh_token'

      expect(logout(refreshToken)).rejects.toThrow('Token hashing failed')

      expect(mockHashToken).toHaveBeenCalledWith(refreshToken)
      expect(mockRefreshTokenRepo.revokeByHash).not.toHaveBeenCalled()
    })

    it('should propagate error when repository revocation fails', async () => {
      const repoError = new Error('Database revocation failed')
      mockRefreshTokenRepo.revokeByHash.mockImplementation(async () => {
        throw repoError
      })

      const refreshToken = 'valid_refresh_token'

      expect(logout(refreshToken)).rejects.toThrow('Database revocation failed')

      expect(mockHashToken).toHaveBeenCalledWith(refreshToken)
      expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledWith(mockTokenHash)
    })

    it('should handle repository timeout errors', async () => {
      const timeoutError = new Error('Connection timeout')
      mockRefreshTokenRepo.revokeByHash.mockImplementation(async () => {
        throw timeoutError
      })

      const refreshToken = 'valid_refresh_token'

      expect(logout(refreshToken)).rejects.toThrow('Connection timeout')

      expect(mockHashToken).toHaveBeenCalledWith(refreshToken)
      expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledWith(mockTokenHash)
    })

    it('should handle hash function returning invalid result', async () => {
      mockHashToken.mockImplementation(async () => null)

      const refreshToken = 'valid_refresh_token'

      await logout(refreshToken)

      expect(mockHashToken).toHaveBeenCalledWith(refreshToken)
      expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledWith(null)
    })
  })

  describe('function call order and dependencies', () => {
    it('should hash token before revoking', async () => {
      const callOrder: string[] = []

      mockHashToken.mockImplementation(async (_token: string) => {
        callOrder.push('hashToken')

        return mockTokenHash
      })

      mockRefreshTokenRepo.revokeByHash.mockImplementation(async (_hash: string) => {
        callOrder.push('revokeByHash')
      })

      const refreshToken = 'valid_refresh_token'
      await logout(refreshToken)

      expect(callOrder).toEqual(['hashToken', 'revokeByHash'])
    })

    it('should pass hashed result to repository', async () => {
      const customHash = 'custom_hash_result'
      mockHashToken.mockImplementation(async () => customHash)

      const refreshToken = 'valid_refresh_token'
      await logout(refreshToken)

      expect(mockHashToken).toHaveBeenCalledWith(refreshToken)
      expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledWith(customHash)
    })

    it('should stop execution if hashing fails', async () => {
      const callOrder: string[] = []

      mockHashToken.mockImplementation(async () => {
        callOrder.push('hashToken')
        throw new Error('Hash failed')
      })

      mockRefreshTokenRepo.revokeByHash.mockImplementation(async () => {
        callOrder.push('revokeByHash')
      })

      const refreshToken = 'valid_refresh_token'

      expect(logout(refreshToken)).rejects.toThrow('Hash failed')

      expect(callOrder).toEqual(['hashToken'])
    })
  })

  describe('edge cases and boundary conditions', () => {
    it('should handle very long tokens', async () => {
      const longToken = 'a'.repeat(10000)

      await logout(longToken)

      expect(mockHashToken).toHaveBeenCalledWith(longToken)
      expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledWith(mockTokenHash)
    })

    it('should handle tokens with special characters', async () => {
      const specialTokens = [
        '!@#$%^&*()_+-=[]{}|;:,.<>?',
        'token\nwith\nnewlines',
        'token\twith\ttabs',
        'token with spaces',
        'token"with"quotes',
        'token\'with\'quotes',
        'token\\with\\backslashes',
        '😀🔑💻🚀', // emojis
        'токен_кириллица', // cyrillic
        '令牌中文', // chinese
      ]

      for (const token of specialTokens) {
        await logout(token)

        expect(mockHashToken).toHaveBeenCalledWith(token)
        expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledWith(mockTokenHash)
      }

      expect(mockHashToken).toHaveBeenCalledTimes(specialTokens.length)
      expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledTimes(specialTokens.length)
    })

    it('should handle concurrent logout calls', async () => {
      const refreshToken = 'concurrent_token'
      const numCalls = 5

      const promises = []
      for (let i = 0; i < numCalls; i++) {
        promises.push(logout(refreshToken))
      }

      await Promise.all(promises)

      expect(mockHashToken).toHaveBeenCalledTimes(numCalls)
      expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledTimes(numCalls)

      // Verify all calls were made with the same parameters
      for (let i = 0; i < numCalls; i++) {
        expect(mockHashToken).toHaveBeenNthCalledWith(i + 1, refreshToken)
        expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenNthCalledWith(i + 1, mockTokenHash)
      }
    })
  })

  describe('return value', () => {
    it('should return undefined for valid token logout', async () => {
      const result = await logout('valid_token')

      expect(result).toBeUndefined()
    })

    it('should return undefined for early return scenarios', async () => {
      const undefinedResult = await logout(undefined)
      const nullResult = await logout(null as any)
      const emptyResult = await logout('')

      expect(undefinedResult).toBeUndefined()
      expect(nullResult).toBeUndefined()
      expect(emptyResult).toBeUndefined()
    })
  })

  describe('parameter validation', () => {
    it('should return early for falsy values', async () => {
      const falsyValues = [false, 0, Number.NaN]

      for (const value of falsyValues) {
        await logout(value as any)

        // These are falsy values, so should trigger early return
        expect(mockHashToken).not.toHaveBeenCalled()
        expect(mockRefreshTokenRepo.revokeByHash).not.toHaveBeenCalled()
      }
    })

    it('should process truthy non-string values', async () => {
      const truthyValues = [1, true, {}, []]

      for (const value of truthyValues) {
        await logout(value as any)

        // These are truthy values, so should not trigger early return
        expect(mockHashToken).toHaveBeenCalledWith(value)
        expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledWith(mockTokenHash)
      }

      expect(mockHashToken).toHaveBeenCalledTimes(truthyValues.length)
      expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledTimes(truthyValues.length)
    })
  })
})
