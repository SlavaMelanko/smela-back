import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { createTestApp, ModuleMocker, post } from '@/__tests__'
import { HttpStatus } from '@/net/http'
import { TOKEN_LENGTH } from '@/security/token'

import checkInviteRoute from '../index'

describe('Check Invite Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const CHECK_INVITE_URL = '/api/v1/auth/check-invite'

  let app: Hono
  let mockCheckInvite: any

  beforeEach(async () => {
    mockCheckInvite = mock(async () => ({
      teamName: 'Acme Corp',
    }))

    await moduleMocker.mock('@/use-cases/auth/check-invite', () => ({
      default: mockCheckInvite,
    }))

    app = createTestApp('/api/v1/auth', checkInviteRoute)
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  const validPayload = {
    data: {
      token: '1'.repeat(TOKEN_LENGTH),
    },
  }

  describe('POST /auth/check-invite', () => {
    it('should check invite and return team name', async () => {
      const res = await post(app, CHECK_INVITE_URL, validPayload)

      expect(res.status).toBe(HttpStatus.OK)

      const json = await res.json()
      expect(json).toEqual({ data: { teamName: 'Acme Corp' } })

      expect(mockCheckInvite).toHaveBeenCalledWith(validPayload.data.token)
      expect(mockCheckInvite).toHaveBeenCalledTimes(1)
    })

    it('should handle check invite errors', async () => {
      mockCheckInvite.mockImplementationOnce(() => {
        throw new Error('Check invite failed')
      })

      const res = await post(app, CHECK_INVITE_URL, validPayload)

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockCheckInvite).toHaveBeenCalledTimes(1)
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

        const res = await post(app, CHECK_INVITE_URL, payload)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        expect(mockCheckInvite).not.toHaveBeenCalled()
      }
    })

    it('should handle malformed requests', async () => {
      const scenarios: Array<{ name: string, headers?: Record<string, string>, body?: any }> = [
        { name: 'missing Content-Type', headers: {}, body: validPayload },
        { name: 'malformed JSON', headers: { 'Content-Type': 'application/json' }, body: '{invalid json}' },
        { name: 'missing request body', headers: { 'Content-Type': 'application/json' }, body: '' },
      ]

      for (const { headers, body } of scenarios) {
        const res = await post(app, CHECK_INVITE_URL, body, headers)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        expect(mockCheckInvite).not.toHaveBeenCalled()
      }
    })
  })
})
