import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { ModuleMocker } from '@/__tests__/module-mocker'
import { loggerMiddleware, onError } from '@/middleware'
import { Role, Status } from '@/types'

import verifyEmailRoute from '../index'

describe('Verify Email Endpoint', () => {
  const moduleMocker = new ModuleMocker()

  let app: Hono
  let mockVerifyEmail: any

  const createApp = () => {
    app = new Hono()
    app.use(loggerMiddleware)
    app.onError(onError)
    app.route('/api/v1/auth', verifyEmailRoute)
  }

  const postRequest = (
    body: any,
    headers: Record<string, string> = { 'Content-Type': 'application/json' },
    method: string = 'POST',
  ) =>
    app.request('/api/v1/auth/verify-email', {
      method,
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })

  beforeEach(async () => {
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

    await moduleMocker.mock('../verify-email', () => ({
      default: mockVerifyEmail,
    }))

    createApp()
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  describe('POST /auth/verify-email', () => {
    it('should return user and token on successful email verification', async () => {
      const validToken = 'a'.repeat(64)

      const res = await postRequest({ token: validToken })

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

    it('should validate token requirements', async () => {
      const invalidTokens = [
        '',
        'a'.repeat(32),
        'a'.repeat(63),
        'a'.repeat(65),
        'a'.repeat(128),
      ]

      for (const token of invalidTokens) {
        const res = await postRequest({ token })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should require token parameter', async () => {
      const res = await postRequest({})

      expect(res.status).toBe(StatusCodes.BAD_REQUEST)
      const json = await res.json()
      expect(json).toHaveProperty('error')
    })

    it('should only accept POST method', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH']
      const validToken = 'a'.repeat(64)

      for (const method of methods) {
        const res = await postRequest(
          { token: validToken },
          { 'Content-Type': 'application/json' },
          method,
        )

        expect(res.status).toBe(StatusCodes.NOT_FOUND)
      }
    })

    it('should handle malformed requests', async () => {
      const validToken = 'a'.repeat(64)

      const malformedRequests: Array<{ name: string, headers?: Record<string, string>, body?: any }> = [
        { name: 'missing Content-Type', headers: {}, body: { token: validToken } },
        { name: 'malformed JSON', headers: { 'Content-Type': 'application/json' }, body: '{ invalid json' },
        { name: 'missing request body', headers: { 'Content-Type': 'application/json' }, body: '' },
      ]

      for (const testCase of malformedRequests) {
        const res = testCase.name === 'missing Content-Type'
          ? await app.request('/api/v1/auth/verify-email', {
              method: 'POST',
              headers: testCase.headers,
              body: JSON.stringify(testCase.body),
            })
          : await postRequest(testCase.body, testCase.headers)

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
      }
    })

    it('should return user and token for valid email verification', async () => {
      const validToken = 'b'.repeat(64)

      const res = await postRequest({ token: validToken })

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

      const res = await postRequest({ token: validToken })

      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
      expect(mockVerifyEmail).toHaveBeenCalledTimes(1)
    })
  })
})
