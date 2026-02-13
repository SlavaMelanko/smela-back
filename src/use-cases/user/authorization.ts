import type { Role } from '@/types'

import { teamRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { isAdmin } from '@/types'

export const assertTeamAccess = async (
  userId: string,
  teamId: string,
  userRole?: Role,
): Promise<void> => {
  if (userRole && isAdmin(userRole)) {
    return
  }

  const membership = await teamRepo.findMember(userId, teamId)

  if (!membership) {
    throw new AppError(ErrorCode.Forbidden)
  }
}
