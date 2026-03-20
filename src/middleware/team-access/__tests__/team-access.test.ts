import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { testUuids } from '@/__tests__'
import { ErrorCode } from '@/errors'
import { onError } from '@/handlers'
import HttpStatus from '@/net/http/status'
import { Role, Status } from '@/types'

import { teamAccessMiddleware } from '../team-access'

const mockTeamRepoFindMember = mock()

void mock.module('@/data', () => ({
  teamRepo: {
    findMember: mockTeamRepoFindMember,
  },
}))

describe('Team Access Middleware', () => {
  let app: Hono<AppContext>

  beforeEach(() => {
    app = new Hono<AppContext>()
    app.onError(onError)
    mockTeamRepoFindMember.mockClear()
  })

  describe('Regular User Access', () => {
    it('should allow access when user has valid team membership', async () => {
      mockTeamRepoFindMember.mockImplementation(async () => ({
        userId: testUuids.USER_1,
        teamId: testUuids.TEAM_1,
        position: 'Developer',
        invitedBy: testUuids.ADMIN_1,
        joinedAt: new Date(),
      }))

      app.use('/teams/:teamId', async (c, next) => {
        c.set('user', {
          id: testUuids.USER_1,
          email: 'user@example.com',
          role: Role.User,
          status: Status.Active,
        })
        await next()
      })
      app.use('/teams/:teamId', teamAccessMiddleware)
      app.get('/teams/:teamId', c => c.json({ message: 'success' }))

      const res = await app.request(`/teams/${testUuids.TEAM_1}`)

      expect(res.status).toBe(HttpStatus.OK)
      expect(mockTeamRepoFindMember).toHaveBeenCalledWith(testUuids.TEAM_1, testUuids.USER_1)

      const json = await res.json()
      expect(json.message).toBe('success')
    })

    it('should throw Forbidden when user has no team membership', async () => {
      mockTeamRepoFindMember.mockImplementation(async () => undefined)

      app.use('/teams/:teamId', async (c, next) => {
        c.set('user', {
          id: testUuids.USER_1,
          email: 'user@example.com',
          role: Role.User,
          status: Status.Active,
        })
        await next()
      })
      app.use('/teams/:teamId', teamAccessMiddleware)
      app.get('/teams/:teamId', c => c.json({ message: 'success' }))

      const res = await app.request(`/teams/${testUuids.TEAM_1}`)

      expect(res.status).toBe(HttpStatus.FORBIDDEN)
      expect(mockTeamRepoFindMember).toHaveBeenCalledWith(testUuids.TEAM_1, testUuids.USER_1)

      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Forbidden)
    })

    it('should prevent access to different team', async () => {
      mockTeamRepoFindMember.mockImplementation(async () => undefined)

      app.use('/teams/:teamId', async (c, next) => {
        c.set('user', {
          id: testUuids.USER_1,
          email: 'user@example.com',
          role: Role.User,
          status: Status.Active,
        })
        await next()
      })
      app.use('/teams/:teamId', teamAccessMiddleware)
      app.get('/teams/:teamId', c => c.json({ message: 'success' }))

      const res = await app.request(`/teams/${testUuids.TEAM_2}`)

      expect(res.status).toBe(HttpStatus.FORBIDDEN)
      expect(mockTeamRepoFindMember).toHaveBeenCalledWith(testUuids.TEAM_2, testUuids.USER_1)
    })
  })

  describe('Admin User Access', () => {
    it('should allow Admin access without team membership', async () => {
      app.use('/teams/:teamId', async (c, next) => {
        c.set('user', {
          id: testUuids.ADMIN_1,
          email: 'admin@example.com',
          role: Role.Admin,
          status: Status.Active,
        })
        await next()
      })
      app.use('/teams/:teamId', teamAccessMiddleware)
      app.get('/teams/:teamId', c => c.json({ message: 'success' }))

      const res = await app.request(`/teams/${testUuids.TEAM_1}`)

      expect(res.status).toBe(HttpStatus.OK)
      expect(mockTeamRepoFindMember).not.toHaveBeenCalled()

      const json = await res.json()
      expect(json.message).toBe('success')
    })

    it('should allow Admin access to any team', async () => {
      app.use('/teams/:teamId', async (c, next) => {
        c.set('user', {
          id: testUuids.ADMIN_1,
          email: 'admin@example.com',
          role: Role.Admin,
          status: Status.Active,
        })
        await next()
      })
      app.use('/teams/:teamId', teamAccessMiddleware)
      app.get('/teams/:teamId', c => c.json({ message: 'success' }))

      const res = await app.request(`/teams/${testUuids.TEAM_2}`)

      expect(res.status).toBe(HttpStatus.OK)
      expect(mockTeamRepoFindMember).not.toHaveBeenCalled()
    })
  })

  describe('Owner User Access', () => {
    it('should allow Owner access without team membership', async () => {
      app.use('/teams/:teamId', async (c, next) => {
        c.set('user', {
          id: testUuids.OWNER_1,
          email: 'owner@example.com',
          role: Role.Owner,
          status: Status.Active,
        })
        await next()
      })
      app.use('/teams/:teamId', teamAccessMiddleware)
      app.get('/teams/:teamId', c => c.json({ message: 'success' }))

      const res = await app.request(`/teams/${testUuids.TEAM_1}`)

      expect(res.status).toBe(HttpStatus.OK)
      expect(mockTeamRepoFindMember).not.toHaveBeenCalled()

      const json = await res.json()
      expect(json.message).toBe('success')
    })

    it('should allow Owner access to any team', async () => {
      app.use('/teams/:teamId', async (c, next) => {
        c.set('user', {
          id: testUuids.OWNER_1,
          email: 'owner@example.com',
          role: Role.Owner,
          status: Status.Active,
        })
        await next()
      })
      app.use('/teams/:teamId', teamAccessMiddleware)
      app.get('/teams/:teamId', c => c.json({ message: 'success' }))

      const res = await app.request(`/teams/${testUuids.TEAM_2}`)

      expect(res.status).toBe(HttpStatus.OK)
      expect(mockTeamRepoFindMember).not.toHaveBeenCalled()
    })
  })

  describe('Database Query Optimization', () => {
    it('should skip database query for Admin users', async () => {
      app.use('/teams/:teamId', async (c, next) => {
        c.set('user', {
          id: testUuids.ADMIN_1,
          email: 'admin@example.com',
          role: Role.Admin,
          status: Status.Active,
        })
        await next()
      })
      app.use('/teams/:teamId', teamAccessMiddleware)
      app.get('/teams/:teamId', c => c.json({ message: 'success' }))

      await app.request(`/teams/${testUuids.TEAM_1}`)

      expect(mockTeamRepoFindMember).not.toHaveBeenCalled()
    })

    it('should skip database query for Owner users', async () => {
      app.use('/teams/:teamId', async (c, next) => {
        c.set('user', {
          id: testUuids.OWNER_1,
          email: 'owner@example.com',
          role: Role.Owner,
          status: Status.Active,
        })
        await next()
      })
      app.use('/teams/:teamId', teamAccessMiddleware)
      app.get('/teams/:teamId', c => c.json({ message: 'success' }))

      await app.request(`/teams/${testUuids.TEAM_1}`)

      expect(mockTeamRepoFindMember).not.toHaveBeenCalled()
    })

    it('should query database for regular User', async () => {
      mockTeamRepoFindMember.mockImplementation(async () => ({
        userId: testUuids.USER_1,
        teamId: testUuids.TEAM_1,
      }))

      app.use('/teams/:teamId', async (c, next) => {
        c.set('user', {
          id: testUuids.USER_1,
          email: 'user@example.com',
          role: Role.User,
          status: Status.Active,
        })
        await next()
      })
      app.use('/teams/:teamId', teamAccessMiddleware)
      app.get('/teams/:teamId', c => c.json({ message: 'success' }))

      await app.request(`/teams/${testUuids.TEAM_1}`)

      expect(mockTeamRepoFindMember).toHaveBeenCalledTimes(1)
      expect(mockTeamRepoFindMember).toHaveBeenCalledWith(testUuids.TEAM_1, testUuids.USER_1)
    })
  })

  describe('Error Handling', () => {
    it('should throw AppError with Forbidden code for unauthorized access', async () => {
      mockTeamRepoFindMember.mockImplementation(async () => undefined)

      app.use('/teams/:teamId', async (c, next) => {
        c.set('user', {
          id: testUuids.USER_1,
          email: 'user@example.com',
          role: Role.User,
          status: Status.Active,
        })
        await next()
      })
      app.use('/teams/:teamId', teamAccessMiddleware)
      app.get('/teams/:teamId', c => c.json({ message: 'success' }))

      const res = await app.request(`/teams/${testUuids.TEAM_1}`)

      expect(res.status).toBe(HttpStatus.FORBIDDEN)

      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Forbidden)
      expect(json.error).toBeDefined()
    })

    it('should propagate database errors', async () => {
      mockTeamRepoFindMember.mockImplementation(async () => {
        throw new Error('Database connection failed')
      })

      app.use('/teams/:teamId', async (c, next) => {
        c.set('user', {
          id: testUuids.USER_1,
          email: 'user@example.com',
          role: Role.User,
          status: Status.Active,
        })
        await next()
      })
      app.use('/teams/:teamId', teamAccessMiddleware)
      app.get('/teams/:teamId', c => c.json({ message: 'success' }))

      const res = await app.request(`/teams/${testUuids.TEAM_1}`)

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    })
  })
})
