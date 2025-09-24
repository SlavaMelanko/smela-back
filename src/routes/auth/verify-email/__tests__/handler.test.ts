import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'
import { Role, Status } from '@/types'

import verifyEmailRoute from '../index'

describe('Verify Email Handler', () => {
  let app: Hono
  let mockVerifyEmail: any

  beforeEach(() => {
    mockVerifyEmail = mock(() => Promise.resolve({
      user: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: Role.User,
        status: Status.Verified,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      token: 'verify-jwt-token',
    }))

    mock.module('../verify-email', () => ({
      default: mockVerifyEmail,
    }))

    app = new Hono()
    app.onError(onError)
    app.route('/api/v1/auth', verifyEmailRoute)
  })

  describe('POST /auth/verify-email', () => {
    it('should return user and token on successful email verification', async () => {
      const validToken = 'a'.repeat(64)

      const res = await app.request('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: validToken,
        }),
      })

      expect(res.status).toBe(StatusCodes.OK)

      const data = await res.json()
      expect(data).toEqual({
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: Role.User,
          status: Status.Verified,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        token: 'verify-jwt-token',
      })

      expect(mockVerifyEmail).toHaveBeenCalledTimes(1)
      expect(mockVerifyEmail).toHaveBeenCalledWith(validToken)
    })

    it('should return user and token for valid email verification', async () => {
      const validToken = 'b'.repeat(64)

      const res = await app.request('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: validToken,
        }),
      })

      expect(res.status).toBe(StatusCodes.OK)

      const data = await res.json()
      expect(data.token).toBe('verify-jwt-token')
      expect(data.user).toHaveProperty('email', 'john@example.com')
    })

    it('should handle verification errors', async () => {
      mockVerifyEmail.mockImplementationOnce(() => {
        throw new Error('Token verification failed')
      })

      const validToken = 'c'.repeat(64)

      const res = await app.request('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: validToken,
        }),
      })

      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)

      expect(mockVerifyEmail).toHaveBeenCalledTimes(1)
    })
  })
})
