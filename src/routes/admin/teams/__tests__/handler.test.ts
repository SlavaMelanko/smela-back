import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { Team } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { HttpStatus } from '@/net/http'

import { createTeamHandler, getTeamsHandler } from '../handler'

const { TEAM_1 } = testUuids

describe('getTeamsHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const DEFAULT_LIMIT = 25

  let mockContext: any
  let mockJson: any
  let mockGetTeams: any

  const mockTeams: Team[] = [
    {
      id: TEAM_1,
      name: 'Acme Corp',
      website: 'https://acme.com',
      description: 'A test team',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ]

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: {
        valid: mock(() => ({ search: undefined, page: 1, limit: DEFAULT_LIMIT })),
      },
      json: mockJson,
    }
    mockGetTeams = mock(async () => ({
      teams: mockTeams,
      pagination: { page: 1, limit: DEFAULT_LIMIT, total: 1, totalPages: 1 },
    }))

    await moduleMocker.mock('@/use-cases/admin', () => ({ getTeams: mockGetTeams }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getTeams and return teams with pagination and OK status', async () => {
    const result = await getTeamsHandler(mockContext)

    expect(mockGetTeams).toHaveBeenCalledWith(
      { search: undefined },
      { page: 1, limit: DEFAULT_LIMIT },
    )
    expect(mockJson).toHaveBeenCalledWith(
      { teams: mockTeams, pagination: { page: 1, limit: DEFAULT_LIMIT, total: 1, totalPages: 1 } },
      HttpStatus.OK,
    )
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should pass search filter when provided', async () => {
    mockContext.req.valid = mock(() => ({ search: 'acme', page: 1, limit: DEFAULT_LIMIT }))

    await getTeamsHandler(mockContext)

    expect(mockGetTeams).toHaveBeenCalledWith({ search: 'acme' }, { page: 1, limit: DEFAULT_LIMIT })
  })

  it('should propagate error when getTeams throws', async () => {
    mockGetTeams.mockImplementation(async () => {
      throw new Error('Database connection failed')
    })

    expect(getTeamsHandler(mockContext)).rejects.toThrow('Database connection failed')
  })
})

describe('createTeamHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockCreateTeam: any

  const mockTeam: Team = {
    id: TEAM_1,
    name: 'New Team',
    website: 'https://newteam.com',
    description: 'A new team',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: {
        valid: mock(() => ({
          name: 'New Team',
          website: 'https://newteam.com',
          description: 'A new team',
        })),
      },
      json: mockJson,
    }
    mockCreateTeam = mock(async () => ({ team: mockTeam }))

    await moduleMocker.mock('@/use-cases/admin', () => ({ createTeam: mockCreateTeam }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call createTeam and return created team with CREATED status', async () => {
    const result = await createTeamHandler(mockContext)

    expect(mockCreateTeam).toHaveBeenCalledWith({ name: 'New Team', website: 'https://newteam.com', description: 'A new team' })
    expect(mockJson).toHaveBeenCalledWith({ team: mockTeam }, HttpStatus.CREATED)
    expect(result.status).toBe(HttpStatus.CREATED)
  })

  it('should propagate error when createTeam throws', async () => {
    mockCreateTeam.mockImplementation(async () => {
      throw new Error('Team with this name already exists')
    })

    expect(createTeamHandler(mockContext)).rejects.toThrow('Team with this name already exists')
  })
})
