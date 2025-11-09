import { beforeEach, describe, expect, it } from 'bun:test'
import { Hono } from 'hono'

import type { AppContext } from '@/context'

import env from '@/env'
import { ErrorCode } from '@/errors'
import { onError } from '@/handlers'
import HttpStatus from '@/net/http/status'
import { signJwt } from '@/security/jwt'
import { Role, Status } from '@/types'

import { userRelaxedAuthMiddleware, userStrictAuthMiddleware } from '../index'

describe('Auth Middleware - New User Access', () => {
  let app: Hono<AppContext>

  beforeEach(() => {
    app = new Hono<AppContext>()
    app.onError(onError)
  })

  describe('Strict Auth - Status Validation', () => {
    it('should reject New status', async () => {
      const token = await signJwt(
        { id: 1, email: 'user@example.com', role: Role.User, status: Status.New },
        { secret: env.JWT_SECRET },
      )

      app.use('/strict', userStrictAuthMiddleware)
      app.get('/strict', c => c.json({ message: 'success' }))

      const res = await app.request('/strict', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      expect(res.status).toBe(HttpStatus.FORBIDDEN)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Forbidden)
      expect(json.error).toBe('Status validation failure')
    })

    it('should accept active statuses', async () => {
      const activeStatuses = [Status.Verified, Status.Trial, Status.Active]

      for (const status of activeStatuses) {
        const testApp = new Hono<AppContext>()
        testApp.onError(onError)

        const token = await signJwt(
          { id: 2, email: 'user@example.com', role: Role.User, status },
          { secret: env.JWT_SECRET },
        )

        testApp.use('/strict', userStrictAuthMiddleware)
        testApp.get('/strict', c => c.json({ message: 'success' }))

        const res = await testApp.request('/strict', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        expect(res.status).toBe(HttpStatus.OK)
        const json = await res.json()
        expect(json.message).toBe('success')
      }
    })
  })

  describe('Relaxed Auth - Status Validation', () => {
    it('should accept new and active statuses', async () => {
      const allowedStatuses = [Status.New, Status.Verified, Status.Trial, Status.Active]

      for (const status of allowedStatuses) {
        const testApp = new Hono<AppContext>()
        testApp.onError(onError)

        const token = await signJwt(
          { id: 5, email: 'user@example.com', role: Role.User, status },
          { secret: env.JWT_SECRET },
        )

        testApp.use('/relaxed', userRelaxedAuthMiddleware)
        testApp.get('/relaxed', c => c.json({ message: 'success' }))

        const res = await testApp.request('/relaxed', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        expect(res.status).toBe(HttpStatus.OK)
        const json = await res.json()
        expect(json.message).toBe('success')
      }
    })

    it('should reject Suspended status', async () => {
      const token = await signJwt(
        { id: 9, email: 'user@example.com', role: Role.User, status: Status.Suspended },
        { secret: env.JWT_SECRET },
      )

      app.use('/relaxed', userRelaxedAuthMiddleware)
      app.get('/relaxed', c => c.json({ message: 'success' }))

      const res = await app.request('/relaxed', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      expect(res.status).toBe(HttpStatus.FORBIDDEN)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Forbidden)
      expect(json.error).toBe('Status validation failure')
    })
  })
})
