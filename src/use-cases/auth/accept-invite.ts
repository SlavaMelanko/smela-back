import type { DeviceInfo } from '@/net/http/device'

import { authRepo, db, teamRepo, tokenRepo, userRepo } from '@/data'
import { hashPassword } from '@/security/password'
import { TokenStatus, TokenType } from '@/security/token'
import Status from '@/types/status'

import { resolvePermissionList } from '../resolve-permissions'
import { createAuthTokens, validateOneTimeToken } from '../tokens'

export interface AcceptInviteInput {
  token: string
  password: string
}

export const acceptInvite = async (
  { token, password }: AcceptInviteInput,
  deviceInfo: DeviceInfo,
) => {
  const validatedToken = await validateOneTimeToken(token, TokenType.UserInvite)

  const user = await db.transaction(async (tx) => {
    // Mark token as used
    await tokenRepo.update(validatedToken.id, {
      status: TokenStatus.Used,
      usedAt: new Date(),
    }, tx)

    // Update user's password
    const passwordHash = await hashPassword(password)
    await authRepo.update(validatedToken.userId, { passwordHash }, tx)

    // Activate user
    return userRepo.update(validatedToken.userId, { status: Status.Active }, tx)
  })

  const [team, permissions] = await Promise.all([
    teamRepo.findUserTeam(user.id),
    resolvePermissionList(user.id),
  ])

  const [accessToken, refreshToken] = await createAuthTokens(user, deviceInfo, permissions)

  return {
    data: { user, team, permissions, accessToken },
    refreshToken,
  }
}
