import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { createTestApp, ModuleMocker, post } from '@/__tests__'
import { HttpStatus } from '@/net/http'
import { TOKEN_LENGTH } from '@/security/token'

import acceptInviteRoute from '../index'

describe('Accept Invite Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const ACCEPT_INVITE_URL = '/api/v1/auth/accept-invite'

  let app: Hono
  let mockAcceptInvite: any

  beforeEach(async () => {
    mockAcceptInvite = mock(async () => ({
      data: { user: { id: 1 }, accessToken: 'test-token' },
      refreshToken: 'refresh-token',
    }))

    await moduleMocker.mock('@/use-cases/auth/accept-invite', () => ({
      default: mockAcceptInvite,
    }))

    app = createTestApp('/api/v1/auth', acceptInviteRoute)
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  const validPayload = {
    data: {
      token: '1'.repeat(TOKEN_LENGTH),
      password: 'NewSecure@123',
    },
  }

  describe('POST /auth/accept-invite', () => {
    it('should accept invite and return user with tokens', async () => {
      const res = await post(app, ACCEPT_INVITE_URL, validPayload)

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data).toEqual({ user: { id: 1 }, accessToken: 'test-token' })

      expect(mockAcceptInvite).toHaveBeenCalledWith({
        token: validPayload.data.token,
        password: validPayload.data.password,
        deviceInfo: { ipAddress: null, userAgent: null },
      })
      expect(mockAcceptInvite).toHaveBeenCalledTimes(1)

      // Verify refresh token cookie is set
      const cookies = res.headers.get('set-cookie')
      expect(cookies).toContain('refresh-token')
    })

    it('should handle accept invite errors', async () => {
      mockAcceptInvite.mockImplementationOnce(() => {
        throw new Error('Accept invite failed')
      })

      const res = await post(app, ACCEPT_INVITE_URL, validPayload)

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockAcceptInvite).toHaveBeenCalledTimes(1)
    })

    it('should validate token requirements', async () => {
      const invalidTokens = [
        { name: 'short token', token: 'short-token' },
        { name: 'long token', token: 'a'.repeat(100) },
        { name: 'missing token', token: null },
      ]

      for (const testCase of invalidTokens) {
        const payload: any = { data: { ...validPayload.data } }
        if (testCase.token !== null) {
          payload.data.token = testCase.token
        } else {
          delete payload.data.token
        }

        const res = await post(app, ACCEPT_INVITE_URL, payload)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        expect(mockAcceptInvite).not.toHaveBeenCalled()
      }
    })

    it('should validate password requirements', async () => {
      const invalidPasswords = [
        { name: 'short password', password: 'short' },
        { name: 'no special chars', password: 'NoSpecialChars123' },
        { name: 'no numbers', password: 'NoNumbers@Special' },
        { name: 'no letters', password: '12345678@#$' },
        { name: 'missing password', password: null },
      ]

      for (const testCase of invalidPasswords) {
        const payload: any = { data: { ...validPayload.data } }
        if (testCase.password !== null) {
          payload.data.password = testCase.password
        } else {
          delete payload.data.password
        }

        const res = await post(app, ACCEPT_INVITE_URL, payload)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        expect(mockAcceptInvite).not.toHaveBeenCalled()
      }
    })

    it('should handle malformed requests', async () => {
      const scenarios: Array<{ name: string, headers?: Record<string, string>, body?: any }> = [
        { name: 'missing Content-Type', headers: {}, body: validPayload },
        { name: 'malformed JSON', headers: { 'Content-Type': 'application/json' }, body: '{invalid json}' },
        { name: 'missing request body', headers: { 'Content-Type': 'application/json' }, body: '' },
      ]

      for (const { headers, body } of scenarios) {
        const res = await post(app, ACCEPT_INVITE_URL, body, headers)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        expect(mockAcceptInvite).not.toHaveBeenCalled()
      }
    })
  })
})
