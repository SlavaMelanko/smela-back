import { beforeEach, describe, expect, it } from 'bun:test'
import { Hono } from 'hono'

import type { AppContext } from '@/context'

import env from '@/env'
import { ErrorCode } from '@/errors'
import { onError } from '@/handlers'
import HttpStatus from '@/net/http/status'
import { signJwt } from '@/security/jwt'
import { Role, Status } from '@/types'

import { ownerAuthMiddleware } from '../index'

describe('Owner Authentication Middleware', () => {
  let app: Hono<AppContext>

  beforeEach(() => {
    app = new Hono<AppContext>()
    app.onError(onError)
  })

  describe('Role Validation', () => {
    it('should allow Owner with Active status', async () => {
      const ownerToken = await signJwt(
        { id: 1, email: 'owner@example.com', role: Role.Owner, status: Status.Active },
        { secret: env.JWT_ACCESS_SECRET },
      )

      app.use('/owner', ownerAuthMiddleware)
      app.get('/owner', c => c.json({ message: 'success' }))

      const res = await app.request('/owner', {
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      })

      expect(res.status).toBe(HttpStatus.OK)
      const json = await res.json()
      expect(json.message).toBe('success')
    })

    it('should reject Admin even with Active status', async () => {
      const adminToken = await signJwt(
        { id: 2, email: 'admin@example.com', role: Role.Admin, status: Status.Active },
        { secret: env.JWT_ACCESS_SECRET },
      )

      app.use('/owner', ownerAuthMiddleware)
      app.get('/owner', c => c.json({ message: 'success' }))

      const res = await app.request('/owner', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      expect(res.status).toBe(HttpStatus.FORBIDDEN)
      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Forbidden)
      expect(json.error).toBe('Role validation failure')
    })

    it('should reject User role with Active status', async () => {
      const userToken = await signJwt(
        { id: 3, email: 'user@example.com', role: Role.User, status: Status.Active },
        { secret: env.JWT_ACCESS_SECRET },
      )

      app.use('/owner', ownerAuthMiddleware)
      app.get('/owner', c => c.json({ message: 'success' }))

      const res = await app.request('/owner', {
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
          { id: 4, email: 'owner@example.com', role: Role.Owner, status },
          { secret: env.JWT_ACCESS_SECRET },
        )

        testApp.use('/owner', ownerAuthMiddleware)
        testApp.get('/owner', c => c.json({ message: 'success' }))

        const res = await testApp.request('/owner', {
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
