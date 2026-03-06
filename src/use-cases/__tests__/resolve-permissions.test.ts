import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { ActivePermissionRow } from '@/data/repositories/rbac/types'

import { ModuleMocker, testUuids } from '@/__tests__'
import { Action, Permission, Resource } from '@/types'

import { resolvePermissionList } from '../resolve-permissions'

describe('resolvePermissionList', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockFindUserPermissions: any

  beforeEach(async () => {
    mockFindUserPermissions = mock(async (): Promise<ActivePermissionRow[]> => [])

    await moduleMocker.mock('@/data', () => ({
      rbacRepo: {
        findUserPermissions: mockFindUserPermissions,
      },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should return undefined when user has no permissions', async () => {
    const result = await resolvePermissionList(testUuids.USER_1)

    expect(result).toBeUndefined()
    expect(mockFindUserPermissions).toHaveBeenCalledWith(testUuids.USER_1)
  })

  it('should map action:resource rows to typed Permission values', async () => {
    mockFindUserPermissions.mockImplementation(async () => [
      { action: Action.View, resource: Resource.Users },
      { action: Action.Manage, resource: Resource.Teams },
    ])

    const result = await resolvePermissionList(testUuids.ADMIN_1)

    expect(result).toEqual([Permission.ViewUsers, Permission.ManageTeams])
  })

  it('should pass userId to the repository', async () => {
    await resolvePermissionList(testUuids.ADMIN_1)

    expect(mockFindUserPermissions).toHaveBeenCalledWith(testUuids.ADMIN_1)
    expect(mockFindUserPermissions).toHaveBeenCalledTimes(1)
  })

  it('should return all permissions when multiple rows are returned', async () => {
    mockFindUserPermissions.mockImplementation(async () => [
      { action: Action.View, resource: Resource.Users },
      { action: Action.View, resource: Resource.Admins },
      { action: Action.View, resource: Resource.Teams },
      { action: Action.Manage, resource: Resource.Users },
      { action: Action.Manage, resource: Resource.Admins },
      { action: Action.Manage, resource: Resource.Teams },
    ])

    const result = await resolvePermissionList(testUuids.USER_1)

    expect(result).toHaveLength(6)
    expect(result).toContain(Permission.ViewUsers)
    expect(result).toContain(Permission.ViewAdmins)
    expect(result).toContain(Permission.ViewTeams)
    expect(result).toContain(Permission.ManageUsers)
    expect(result).toContain(Permission.ManageAdmins)
    expect(result).toContain(Permission.ManageTeams)
  })
})
