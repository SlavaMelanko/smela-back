import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { Company as Team } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { HttpStatus } from '@/net/http'

import {
  createTeamHandler,
  getTeamHandler,
  getTeamsHandler,
  updateTeamHandler,
} from '../handler'

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
        valid: mock(() => ({
          search: undefined,
          page: 1,
          limit: DEFAULT_LIMIT,
        })),
      },
      json: mockJson,
    }

    mockGetTeams = mock(async () => ({
      teams: mockTeams,
      pagination: {
        page: 1,
        limit: DEFAULT_LIMIT,
        total: 1,
        totalPages: 1,
      },
    }))

    await moduleMocker.mock('@/use-cases/user', () => ({
      getTeams: mockGetTeams,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getTeams with correct parameters', async () => {
    await getTeamsHandler(mockContext)

    expect(mockGetTeams).toHaveBeenCalledWith(
      { search: undefined },
      { page: 1, limit: DEFAULT_LIMIT },
    )
  })

  it('should return teams and pagination with OK status', async () => {
    const result = await getTeamsHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith(
      {
        teams: mockTeams,
        pagination: {
          page: 1,
          limit: DEFAULT_LIMIT,
          total: 1,
          totalPages: 1,
        },
      },
      HttpStatus.OK,
    )
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should pass search filter when provided', async () => {
    mockContext.req.valid = mock(() => ({
      search: 'acme',
      page: 1,
      limit: DEFAULT_LIMIT,
    }))

    await getTeamsHandler(mockContext)

    expect(mockGetTeams).toHaveBeenCalledWith(
      { search: 'acme' },
      { page: 1, limit: DEFAULT_LIMIT },
    )
  })

  it('should propagate error when getTeams throws', async () => {
    mockGetTeams.mockImplementation(async () => {
      throw new Error('Database connection failed')
    })

    expect(getTeamsHandler(mockContext)).rejects.toThrow('Database connection failed')
  })
})

describe('getTeamHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockGetTeam: any

  const mockTeam: Team = {
    id: TEAM_1,
    name: 'Acme Corp',
    website: 'https://acme.com',
    description: 'A test team',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))

    mockContext = {
      req: {
        valid: mock(() => ({ teamId: TEAM_1 })),
      },
      json: mockJson,
    }

    mockGetTeam = mock(async () => ({ team: mockTeam }))

    await moduleMocker.mock('@/use-cases/user', () => ({
      getTeam: mockGetTeam,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getTeam with correct id', async () => {
    await getTeamHandler(mockContext)

    expect(mockGetTeam).toHaveBeenCalledWith(TEAM_1)
  })

  it('should return team with OK status', async () => {
    const result = await getTeamHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith({ team: mockTeam }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when getTeam throws', async () => {
    mockGetTeam.mockImplementation(async () => {
      throw new Error('Team not found')
    })

    expect(getTeamHandler(mockContext)).rejects.toThrow('Team not found')
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

    await moduleMocker.mock('@/use-cases/user', () => ({
      createTeam: mockCreateTeam,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call createTeam with correct body', async () => {
    await createTeamHandler(mockContext)

    expect(mockCreateTeam).toHaveBeenCalledWith({
      name: 'New Team',
      website: 'https://newteam.com',
      description: 'A new team',
    })
  })

  it('should return created team with CREATED status', async () => {
    const result = await createTeamHandler(mockContext)

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

describe('updateTeamHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockUpdateTeam: any

  const mockTeam: Team = {
    id: TEAM_1,
    name: 'Updated Team',
    website: 'https://updated.com',
    description: 'An updated team',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  }

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))

    mockContext = {
      req: {
        valid: mock((type: string) => {
          if (type === 'param') {
            return { teamId: TEAM_1 }
          }

          return { name: 'Updated Team' }
        }),
      },
      json: mockJson,
    }

    mockUpdateTeam = mock(async () => ({ team: mockTeam }))

    await moduleMocker.mock('@/use-cases/user', () => ({
      updateTeam: mockUpdateTeam,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call updateTeam with correct id and body', async () => {
    await updateTeamHandler(mockContext)

    expect(mockUpdateTeam).toHaveBeenCalledWith(TEAM_1, { name: 'Updated Team' })
  })

  it('should return updated team with OK status', async () => {
    const result = await updateTeamHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith({ team: mockTeam }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when updateTeam throws', async () => {
    mockUpdateTeam.mockImplementation(async () => {
      throw new Error('Team not found')
    })

    expect(updateTeamHandler(mockContext)).rejects.toThrow('Team not found')
  })
})
