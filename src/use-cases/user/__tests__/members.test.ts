import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { TeamMember } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import AppError from '@/errors/app-error'
import ErrorCode from '@/errors/codes'
import { Status } from '@/types'

import { removeTeamMember } from '../members'

const { TEAM_1, USER_1 } = testUuids

describe('removeTeamMember', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockMembership: TeamMember
  let mockTeamRepoFindMember: any
  let mockTeamRepoDeleteMember: any
  let mockUserRepoUpdate: any
  let mockTransaction: any

  beforeEach(async () => {
    mockMembership = {
      id: 1,
      userId: USER_1,
      teamId: TEAM_1,
      position: 'Developer',
      invitedBy: null,
      joinedAt: new Date('2024-01-01'),
    }

    mockTeamRepoFindMember = mock(async () => mockMembership)
    mockTeamRepoDeleteMember = mock(async () => {})
    mockUserRepoUpdate = mock(async () => {})
    mockTransaction = mock(async <T>(callback: (tx: unknown) => Promise<T>): Promise<T> => {
      return callback({})
    })

    await moduleMocker.mock('@/data', () => ({
      teamRepo: {
        findMember: mockTeamRepoFindMember,
        deleteMember: mockTeamRepoDeleteMember,
      },
      userRepo: { update: mockUserRepoUpdate },
      db: { transaction: mockTransaction },
    }))

    await moduleMocker.mock('@/types', () => ({ Status }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should throw NotFound when member is not in team', async () => {
    mockTeamRepoFindMember.mockImplementation(async () => undefined)

    expect(removeTeamMember(TEAM_1, USER_1)).rejects.toThrow(AppError)
    expect(removeTeamMember(TEAM_1, USER_1)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Member not found',
    })
  })

  it('should delete membership row in transaction', async () => {
    await removeTeamMember(TEAM_1, USER_1)

    expect(mockTeamRepoDeleteMember).toHaveBeenCalledWith(USER_1, TEAM_1, expect.anything())
  })

  it('should archive user in transaction', async () => {
    await removeTeamMember(TEAM_1, USER_1)

    expect(mockUserRepoUpdate).toHaveBeenCalledWith(
      USER_1,
      { status: Status.Archived },
      expect.anything(),
    )
  })

  it('should run delete and archive atomically in one transaction', async () => {
    await removeTeamMember(TEAM_1, USER_1)

    expect(mockTransaction).toHaveBeenCalledTimes(1)
  })

  it('should return success true', async () => {
    const result = await removeTeamMember(TEAM_1, USER_1)

    expect(result).toEqual({ success: true })
  })
})
