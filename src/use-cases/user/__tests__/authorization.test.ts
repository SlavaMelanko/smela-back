/* eslint-disable ts/await-thenable */
import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { testUuids } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { Role } from '@/types'

import { assertTeamAccess } from '../authorization'

const mockTeamRepoFindMember = mock()

void mock.module('@/data', () => ({
  teamRepo: {
    findMember: mockTeamRepoFindMember,
  },
}))

describe('assertTeamAccess', () => {
  beforeEach(() => {
    mockTeamRepoFindMember.mockClear()
  })

  it('should allow access when membership exists', async () => {
    mockTeamRepoFindMember.mockImplementation(async () => ({
      userId: testUuids.USER_1,
      teamId: testUuids.TEAM_1,
    }))

    await expect(
      assertTeamAccess(testUuids.USER_1, testUuids.TEAM_1),
    ).resolves.toBeUndefined()

    expect(mockTeamRepoFindMember).toHaveBeenCalledWith(
      testUuids.USER_1,
      testUuids.TEAM_1,
    )
  })

  it('should throw Forbidden when membership does not exist', async () => {
    mockTeamRepoFindMember.mockImplementation(async () => undefined)

    await expect(
      assertTeamAccess(testUuids.USER_1, testUuids.TEAM_1),
    ).rejects.toThrow(AppError)

    await expect(
      assertTeamAccess(testUuids.USER_1, testUuids.TEAM_1),
    ).rejects.toMatchObject({
      code: ErrorCode.Forbidden,
    })

    expect(mockTeamRepoFindMember).toHaveBeenCalledWith(
      testUuids.USER_1,
      testUuids.TEAM_1,
    )
  })

  it('should allow admin access even without membership', async () => {
    mockTeamRepoFindMember.mockImplementation(async () => undefined)

    await expect(
      assertTeamAccess(testUuids.USER_1, testUuids.TEAM_1, Role.Admin),
    ).resolves.toBeUndefined()

    // should not call findMember when user is admin
    expect(mockTeamRepoFindMember).not.toHaveBeenCalled()
  })

  it('should allow owner access even without membership', async () => {
    mockTeamRepoFindMember.mockImplementation(async () => undefined)

    await expect(
      assertTeamAccess(testUuids.USER_1, testUuids.TEAM_1, Role.Owner),
    ).resolves.toBeUndefined()

    // should not call findMember when user is owner
    expect(mockTeamRepoFindMember).not.toHaveBeenCalled()
  })

  it('should use consistent error message for all unauthorized attempts', async () => {
    mockTeamRepoFindMember.mockImplementation(async () => undefined)

    const expectedError = {
      code: ErrorCode.Forbidden,
    }

    await expect(
      assertTeamAccess(testUuids.USER_1, testUuids.TEAM_1),
    ).rejects.toMatchObject(expectedError)

    await expect(
      assertTeamAccess(testUuids.USER_2, testUuids.TEAM_2),
    ).rejects.toMatchObject(expectedError)
  })

  it('should check membership for regular users even when userRole is provided', async () => {
    mockTeamRepoFindMember.mockImplementation(async () => ({
      userId: testUuids.USER_1,
      teamId: testUuids.TEAM_1,
    }))

    await expect(
      assertTeamAccess(testUuids.USER_1, testUuids.TEAM_1, Role.User),
    ).resolves.toBeUndefined()

    // should call findMember for regular users
    expect(mockTeamRepoFindMember).toHaveBeenCalledWith(
      testUuids.USER_1,
      testUuids.TEAM_1,
    )
  })
})
