import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { SearchResult } from '@/data'

import { ModuleMocker } from '@/__tests__'
import { Role, Status } from '@/types'

import { searchUsers } from '../users'

describe('Admin Users Use Case', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const DEFAULT_PAGINATION = { page: 1, limit: 25 }

  let mockSearchResult: SearchResult
  let mockUserRepoSearch: any

  beforeEach(async () => {
    mockSearchResult = {
      users: [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: Role.User,
          status: Status.Active,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    }

    mockUserRepoSearch = mock(async () => mockSearchResult)

    await moduleMocker.mock('@/data', () => ({
      userRepo: { search: mockUserRepoSearch },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should filter out admin roles from search params', async () => {
    await searchUsers({ roles: [Role.Admin, Role.User, Role.Owner] }, DEFAULT_PAGINATION)

    expect(mockUserRepoSearch).toHaveBeenCalledWith(
      { roles: [Role.User] },
      DEFAULT_PAGINATION,
    )
  })

  it('should default to user roles when all roles are filtered out', async () => {
    await searchUsers({ roles: [Role.Admin, Role.Owner] }, DEFAULT_PAGINATION)

    expect(mockUserRepoSearch).toHaveBeenCalledWith(
      { roles: [Role.User, Role.Enterprise] },
      DEFAULT_PAGINATION,
    )
  })
})
