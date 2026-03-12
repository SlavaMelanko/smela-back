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
const mockTeamRepoFindSharedTeam = mock()

void mock.module('@/data', () => ({
  teamRepo: {
    findMember: mockTeamRepoFindMember,
    findSharedTeam: mockTeamRepoFindSharedTeam,
  },
}))

describe('Team Access Middleware', () => {
  let app: Hono<AppContext>

  beforeEach(() => {
    app = new Hono<AppContext>()
    app.onError(onError)
    mockTeamRepoFindMember.mockClear()
    mockTeamRepoFindSharedTeam.mockClear()
  })

  describe('teamId param', () => {
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
      expect(mockTeamRepoFindSharedTeam).not.toHaveBeenCalled()

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

  describe('userId param', () => {
    it('should allow access when caller shares a team with the target user', async () => {
      mockTeamRepoFindSharedTeam.mockImplementation(async () => ({ teamId: testUuids.TEAM_1 }))

      app.use('/users/:userId', async (c, next) => {
        c.set('user', {
          id: testUuids.USER_1,
          email: 'user@example.com',
          role: Role.User,
          status: Status.Active,
        })
        await next()
      })
      app.use('/users/:userId', teamAccessMiddleware)
      app.patch('/users/:userId', c => c.json({ message: 'success' }))

      const res = await app.request(`/users/${testUuids.USER_2}`, { method: 'PATCH' })

      expect(res.status).toBe(HttpStatus.OK)
      expect(mockTeamRepoFindSharedTeam).toHaveBeenCalledWith(testUuids.USER_1, testUuids.USER_2)
      expect(mockTeamRepoFindMember).not.toHaveBeenCalled()

      const json = await res.json()
      expect(json.message).toBe('success')
    })

    it('should throw Forbidden when caller shares no team with the target user', async () => {
      mockTeamRepoFindSharedTeam.mockImplementation(async () => undefined)

      app.use('/users/:userId', async (c, next) => {
        c.set('user', {
          id: testUuids.USER_1,
          email: 'user@example.com',
          role: Role.User,
          status: Status.Active,
        })
        await next()
      })
      app.use('/users/:userId', teamAccessMiddleware)
      app.patch('/users/:userId', c => c.json({ message: 'success' }))

      const res = await app.request(`/users/${testUuids.USER_2}`, { method: 'PATCH' })

      expect(res.status).toBe(HttpStatus.FORBIDDEN)
      expect(mockTeamRepoFindSharedTeam).toHaveBeenCalledWith(testUuids.USER_1, testUuids.USER_2)

      const json = await res.json()
      expect(json.code).toBe(ErrorCode.Forbidden)
    })
  })

  describe('Admin / Owner bypass', () => {
    it('should allow Admin access via teamId without membership check', async () => {
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
      expect(mockTeamRepoFindSharedTeam).not.toHaveBeenCalled()
    })

    it('should allow Owner access via teamId without membership check', async () => {
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
      expect(mockTeamRepoFindSharedTeam).not.toHaveBeenCalled()
    })

    it('should allow Admin access via userId without shared team check', async () => {
      app.use('/users/:userId', async (c, next) => {
        c.set('user', {
          id: testUuids.ADMIN_1,
          email: 'admin@example.com',
          role: Role.Admin,
          status: Status.Active,
        })
        await next()
      })
      app.use('/users/:userId', teamAccessMiddleware)
      app.patch('/users/:userId', c => c.json({ message: 'success' }))

      const res = await app.request(`/users/${testUuids.USER_1}`, { method: 'PATCH' })

      expect(res.status).toBe(HttpStatus.OK)
      expect(mockTeamRepoFindMember).not.toHaveBeenCalled()
      expect(mockTeamRepoFindSharedTeam).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should throw Forbidden when neither teamId nor userId param is present', async () => {
      app.use('/resource', async (c, next) => {
        c.set('user', {
          id: testUuids.USER_1,
          email: 'user@example.com',
          role: Role.User,
          status: Status.Active,
        })
        await next()
      })
      app.use('/resource', teamAccessMiddleware)
      app.get('/resource', c => c.json({ message: 'success' }))

      const res = await app.request('/resource')

      expect(res.status).toBe(HttpStatus.FORBIDDEN)
    })

    it('should propagate database errors from findMember', async () => {
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

    it('should propagate database errors from findSharedTeam', async () => {
      mockTeamRepoFindSharedTeam.mockImplementation(async () => {
        throw new Error('Database connection failed')
      })

      app.use('/users/:userId', async (c, next) => {
        c.set('user', {
          id: testUuids.USER_1,
          email: 'user@example.com',
          role: Role.User,
          status: Status.Active,
        })
        await next()
      })
      app.use('/users/:userId', teamAccessMiddleware)
      app.patch('/users/:userId', c => c.json({ message: 'success' }))

      const res = await app.request(`/users/${testUuids.USER_2}`, { method: 'PATCH' })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    })
  })
})
