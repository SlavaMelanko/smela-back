import type { Context } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker } from '@/__tests__'
import { HttpStatus } from '@/net/http'

import { logoutHandler } from '../handler'

describe('Logout Handler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: Context
  let mockBody: any

  let mockRefreshToken: string
  let mockGetRefreshCookie: any
  let mockDeleteRefreshCookie: any

  let mockLogout: any

  beforeEach(async () => {
    mockBody = mock((body: any, status: number) => ({ body, status }))
    mockContext = {
      body: mockBody,
    } as any

    mockRefreshToken = 'refresh_token_123'
    mockGetRefreshCookie = mock(() => mockRefreshToken)
    mockDeleteRefreshCookie = mock(() => {})

    await moduleMocker.mock('@/net/http', () => ({
      getRefreshCookie: mockGetRefreshCookie,
      deleteRefreshCookie: mockDeleteRefreshCookie,
      HttpStatus,
    }))

    mockLogout = mock(async () => {})

    await moduleMocker.mock('@/use-cases/auth/logout', () => ({
      logout: mockLogout,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should logout user and return 204 No Content', async () => {
    const result = await logoutHandler(mockContext)

    expect(mockGetRefreshCookie).toHaveBeenCalledWith(mockContext)
    expect(mockLogout).toHaveBeenCalledWith(mockRefreshToken)
    expect(mockDeleteRefreshCookie).toHaveBeenCalledWith(mockContext)
    expect(mockBody).toHaveBeenCalledWith(null, HttpStatus.NO_CONTENT)
    expect(result.status).toBe(HttpStatus.NO_CONTENT)
  })

  it('should handle logout when no refresh token exists', async () => {
    mockGetRefreshCookie.mockImplementation(() => undefined)

    const result = await logoutHandler(mockContext)

    expect(mockLogout).toHaveBeenCalledWith(undefined)
    expect(mockDeleteRefreshCookie).toHaveBeenCalledWith(mockContext)
    expect(result.status).toBe(HttpStatus.NO_CONTENT)
  })

  it('should propagate error when logout use case throws', async () => {
    mockLogout.mockImplementation(async () => {
      throw new Error('Token revocation failed')
    })

    expect(logoutHandler(mockContext)).rejects.toThrow('Token revocation failed')
    expect(mockDeleteRefreshCookie).not.toHaveBeenCalled()
  })

  it('should propagate error when getRefreshCookie throws', async () => {
    mockGetRefreshCookie.mockImplementation(() => {
      throw new Error('Cookie parsing failed')
    })

    expect(logoutHandler(mockContext)).rejects.toThrow('Cookie parsing failed')
    expect(mockLogout).not.toHaveBeenCalled()
  })

  it('should propagate error when deleteRefreshCookie throws', async () => {
    mockDeleteRefreshCookie.mockImplementation(() => {
      throw new Error('Cookie deletion failed')
    })

    expect(logoutHandler(mockContext)).rejects.toThrow('Cookie deletion failed')
    expect(mockBody).not.toHaveBeenCalled()
  })
})
