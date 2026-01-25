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

import { adminAuthMiddleware } from '../index'

describe('Admin Authentication Middleware', () => {
  let app: Hono<AppContext>

  beforeEach(() => {
    app = new Hono<AppContext>()
    app.onError(onError)
  })

  describe('Role Validation', () => {
    it('should allow Owner with Active status', async () => {
      const ownerToken = await signJwt(
        { id: testUuids.OWNER_1, email: 'owner@example.com', role: Role.Owner, status: Status.Active },
        { secret: env.JWT_SECRET },
      )

      app.use('/admin', adminAuthMiddleware)
      app.get('/admin', c => c.json({ message: 'success' }))

      const res = await app.request('/admin', {
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      })

      expect(res.status).toBe(HttpStatus.OK)
      const json = await res.json()
      expect(json.message).toBe('success')
    })

    it('should allow Admin with Active status', async () => {
      const adminToken = await signJwt(
        { id: testUuids.ADMIN_1, email: 'admin@example.com', role: Role.Admin, status: Status.Active },
        { secret: env.JWT_SECRET },
      )

      app.use('/admin', adminAuthMiddleware)
      app.get('/admin', c => c.json({ message: 'success' }))

      const res = await app.request('/admin', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      expect(res.status).toBe(HttpStatus.OK)
      const json = await res.json()
      expect(json.message).toBe('success')
    })

    it('should reject User role with Active status', async () => {
      const userToken = await signJwt(
        { id: testUuids.USER_1, email: 'user@example.com', role: Role.User, status: Status.Active },
        { secret: env.JWT_SECRET },
      )

      app.use('/admin', adminAuthMiddleware)
      app.get('/admin', c => c.json({ message: 'success' }))

      const res = await app.request('/admin', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      })

      expect(res.status).toBe(HttpStatus.FORBIDDEN)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Forbidden)
      expect(json.error).toBe('Role validation failure')
    })
  })

  describe('Status Validation', () => {
    it('should reject non-Active statuses', async () => {
      const nonActiveStatuses = [Status.New, Status.Verified, Status.Trial, Status.Suspended]

      for (const status of nonActiveStatuses) {
        const testApp = new Hono<AppContext>()
        testApp.onError(onError)

        const token = await signJwt(
          { id: testUuids.ADMIN_1, email: 'admin@example.com', role: Role.Admin, status },
          { secret: env.JWT_SECRET },
        )

        testApp.use('/admin', adminAuthMiddleware)
        testApp.get('/admin', c => c.json({ message: 'success' }))

        const res = await testApp.request('/admin', {
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
})
