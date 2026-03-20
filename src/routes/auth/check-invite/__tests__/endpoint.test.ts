import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { createTestApp, get, ModuleMocker } from '@/__tests__'
import { HttpStatus } from '@/net/http'
import { TOKEN_LENGTH } from '@/security/token'

import { checkInviteRoute } from '../index'

describe('Check Invite Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const CHECK_INVITE_URL = '/api/v1/auth/check-invite'

  let app: Hono
  let mockCheckInvite: any

  const validToken = '1'.repeat(TOKEN_LENGTH)

  beforeEach(async () => {
    mockCheckInvite = mock(async () => ({
      type: 'member',
      teamName: 'Acme Corp',
    }))

    await moduleMocker.mock('@/use-cases/auth/check-invite', () => ({
      checkInvite: mockCheckInvite,
    }))

    app = createTestApp('/api/v1/auth', checkInviteRoute)
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('GET /auth/check-invite', () => {
    it('should check invite and return result', async () => {
      const res = await get(app, `${CHECK_INVITE_URL}?token=${validToken}`)

      expect(res.status).toBe(HttpStatus.OK)

      const json = await res.json()
      expect(json).toEqual({ data: { type: 'member', teamName: 'Acme Corp' } })

      expect(mockCheckInvite).toHaveBeenCalledWith(validToken)
      expect(mockCheckInvite).toHaveBeenCalledTimes(1)
    })

    it('should handle check invite errors', async () => {
      mockCheckInvite.mockImplementationOnce(() => {
        throw new Error('Check invite failed')
      })

      const res = await get(app, `${CHECK_INVITE_URL}?token=${validToken}`)

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockCheckInvite).toHaveBeenCalledTimes(1)
    })

    it('should validate token requirements', async () => {
      const invalidTokens = [
        { name: 'short token', token: 'short-token' },
        { name: 'long token', token: 'a'.repeat(100) },
      ]

      for (const testCase of invalidTokens) {
        const res = await get(app, `${CHECK_INVITE_URL}?token=${testCase.token}`)

        expect(res.status).toBe(HttpStatus.BAD_REQUEST)
        expect(mockCheckInvite).not.toHaveBeenCalled()
      }
    })

    it('should return error when token is missing', async () => {
      const res = await get(app, CHECK_INVITE_URL)

      expect(res.status).toBe(HttpStatus.BAD_REQUEST)
      expect(mockCheckInvite).not.toHaveBeenCalled()
    })
  })
})
