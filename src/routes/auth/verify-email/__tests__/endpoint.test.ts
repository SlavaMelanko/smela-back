import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { createTestApp, doRequest, ModuleMocker, post } from '@/__tests__'
import { HttpStatus } from '@/lib/http-status'
import { Role, Status } from '@/types'

import verifyEmailRoute from '../index'

describe('Verify Email Endpoint', () => {
  const VERIFY_EMAIL_URL = '/api/v1/auth/verify-email'

  let app: Hono
  let mockVerifyEmail: any

  const moduleMocker = new ModuleMocker(import.meta.url)

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

    app = createTestApp('/api/v1/auth', verifyEmailRoute)
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  describe('POST /auth/verify-email', () => {
    it('should return user and token on successful email verification', async () => {
      const validToken = 'a'.repeat(64)

      const res = await post(app, VERIFY_EMAIL_URL, { token: validToken })

      expect(res.status).toBe(HttpStatus.OK)

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

    it('should require token parameter', async () => {
      const res = await post(app, VERIFY_EMAIL_URL, {})

      expect(res.status).toBe(HttpStatus.BAD_REQUEST)
      const json = await res.json()
      expect(json).toHaveProperty('error')
    })

    it('should validate token requirements', async () => {
      const invalidTokens = [
        '', // empty token
        'a'.repeat(32), // token too short
        'a'.repeat(63), // token too short by 1
        'a'.repeat(65), // token too long by 1
        'a'.repeat(128), // token too long
      ]

      for (const token of invalidTokens) {
        const res = await post(app, VERIFY_EMAIL_URL, { token })

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should handle malformed requests', async () => {
      const validToken = 'a'.repeat(64)

      const scenarios: Array<{ name: string, headers?: Record<string, string>, body?: any }> = [
        { name: 'missing Content-Type', headers: {}, body: { token: validToken } },
        { name: 'malformed JSON', headers: { 'Content-Type': 'application/json' }, body: '{ invalid json' },
        { name: 'missing request body', headers: { 'Content-Type': 'application/json' }, body: '' },
      ]

      for (const { headers, body } of scenarios) {
        const res = await post(app, VERIFY_EMAIL_URL, body, headers)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
      }
    })

    it('should handle verification errors', async () => {
      mockVerifyEmail.mockImplementationOnce(() => {
        throw new Error('Token verification failed')
      })

      const validToken = 'c'.repeat(64)

      const res = await post(app, VERIFY_EMAIL_URL, { token: validToken })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockVerifyEmail).toHaveBeenCalledTimes(1)
    })

    it('should only accept POST method', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH']
      const validToken = 'a'.repeat(64)

      for (const method of methods) {
        const res = await doRequest(app, VERIFY_EMAIL_URL, method, { token: validToken }, { 'Content-Type': 'application/json' })

        expect(res.status).toBe(HttpStatus.NOT_FOUND)
      }
    })
  })
})
