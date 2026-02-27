import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { Team, TeamSearchResult } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'

import { createTeam, getTeams } from '../teams'

const { TEAM_1 } = testUuids

describe('getTeams', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const DEFAULT_PAGINATION = { page: 1, limit: 25 }

  let mockSearchResult: TeamSearchResult
  let mockTeamRepoSearch: any

  beforeEach(async () => {
    mockSearchResult = {
      teams: [
        {
          id: TEAM_1,
          name: 'Acme Corp',
          website: 'https://acme.com',
          description: 'A test team',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    }

    mockTeamRepoSearch = mock(async () => mockSearchResult)

    await moduleMocker.mock('@/data', () => ({
      teamRepo: { search: mockTeamRepoSearch },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call teamRepo.search with correct params', async () => {
    await getTeams({ search: 'acme' }, DEFAULT_PAGINATION)

    expect(mockTeamRepoSearch).toHaveBeenCalledWith(
      { search: 'acme' },
      DEFAULT_PAGINATION,
    )
  })

  it('should return teams and pagination', async () => {
    const result = await getTeams({}, DEFAULT_PAGINATION)

    expect(result).toEqual(mockSearchResult)
  })
})

describe('createTeam', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockTeam: Team
  let mockTeamRepoCreate: any

  beforeEach(async () => {
    mockTeam = {
      id: TEAM_1,
      name: 'New Team',
      website: 'https://newteam.com',
      description: 'A new team',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockTeamRepoCreate = mock(async () => mockTeam)

    await moduleMocker.mock('@/data', () => ({
      teamRepo: {
        create: mockTeamRepoCreate,
      },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should create team', async () => {
    const params = { name: 'New Team', website: 'https://newteam.com' }

    const result = await createTeam(params)

    expect(mockTeamRepoCreate).toHaveBeenCalledWith(params)
    expect(result).toEqual({ team: mockTeam })
  })
})
