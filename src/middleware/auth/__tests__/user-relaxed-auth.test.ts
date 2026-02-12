import { beforeEach, describe, expect, it } from 'bun:test'
import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { testUuids } from '@/__tests__'
import env from '@/env'
import { ErrorCode } from '@/errors'
import { onError } from '@/handlers'
import HttpStatus from '@/net/http/status'
import { signJwt } from '@/security/jwt'
import { Role, Status } from '@/types'

import { userRelaxedAuthMiddleware } from '../index'

describe('User Relaxed Authentication Middleware', () => {
  let app: Hono<AppContext>

  beforeEach(() => {
    app = new Hono<AppContext>()
    app.onError(onError)
  })

  describe('Role Validation', () => {
    it('should allow all roles with Active status', async () => {
      const allowedRoles = [Role.User, Role.Admin, Role.Owner]

      for (const role of allowedRoles) {
        const testApp = new Hono<AppContext>()
        testApp.onError(onError)

        const token = await signJwt(
          { id: testUuids.USER_1, email: 'test@example.com', role, status: Status.Active },
          { secret: env.JWT_SECRET },
        )

        testApp.use('/', userRelaxedAuthMiddleware)
        testApp.get('/', c => c.json({ message: 'success' }))

        const res = await testApp.request('/', {
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

  describe('Status Validation', () => {
    it('should allow all New or Active statuses', async () => {
      const allowedStatuses = [Status.New, Status.Verified, Status.Trial, Status.Active]

      for (const status of allowedStatuses) {
        const testApp = new Hono<AppContext>()
        testApp.onError(onError)

        const token = await signJwt(
          { id: testUuids.USER_2, email: 'user@example.com', role: Role.User, status },
          { secret: env.JWT_SECRET },
        )

        testApp.use('/', userRelaxedAuthMiddleware)
        testApp.get('/', c => c.json({ message: 'success' }))

        const res = await testApp.request('/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        expect(res.status).toBe(HttpStatus.OK)
        const json = await res.json()
        expect(json.message).toBe('success')
      }
    })

    it('should reject invalid statuses', async () => {
      const invalidStatuses = [Status.Suspended, Status.Archived, Status.Pending]

      for (const status of invalidStatuses) {
        const testApp = new Hono<AppContext>()
        testApp.onError(onError)

        const token = await signJwt(
          { id: testUuids.USER_3, email: 'user@example.com', role: Role.User, status },
          { secret: env.JWT_SECRET },
        )

        testApp.use('/', userRelaxedAuthMiddleware)
        testApp.get('/', c => c.json({ message: 'success' }))

        const res = await testApp.request('/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        expect(res.status).toBe(HttpStatus.FORBIDDEN)
        const json = await res.json()
        expect(json.code).toBe(ErrorCode.Forbidden)
        expect(json.error).toBe('Status validation failure')
      }
    })
  })

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      app.use('/', userRelaxedAuthMiddleware)
      app.get('/', c => c.json({ message: 'success' }))

      const res = await app.request('/')

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Unauthorized)
    })
  })
})
