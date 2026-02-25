import type { DeviceInfo } from '@/net/http/device'

import { authRepo, db, teamRepo, tokenRepo, userRepo } from '@/data'
import { hashPassword } from '@/security/password'
import { TokenStatus, TokenType } from '@/security/token'
import Status from '@/types/status'

import { resolvePermissions } from '../resolve-permissions'
import { createAuthTokens, validateOneTimeToken } from '../tokens'

export interface AcceptInviteParams {
  token: string
  password: string
}

const acceptInvite = async (
  { token, password }: AcceptInviteParams,
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

  const team = await teamRepo.findUserTeam(user.id)
  const permissions = await resolvePermissions(user.id, user.role)
  const [accessToken, refreshToken] = await createAuthTokens(user, deviceInfo, permissions)

  return {
    data: { user, team, permissions, accessToken },
    refreshToken,
  }
}

export default acceptInvite
