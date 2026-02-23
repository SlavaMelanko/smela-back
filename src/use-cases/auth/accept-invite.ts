import type { DeviceInfo } from '@/net/http/device'

import { authRepo, db, teamRepo, tokenRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { hashPassword } from '@/security/password'
import { TokenStatus, TokenType, TokenValidator } from '@/security/token'
import Status from '@/types/status'

import { createAccessToken, createRefreshToken } from '../create-tokens'
import { resolvePermissions } from '../resolve-permissions'

export interface AcceptInviteParams {
  token: string
  password: string
}

const validateToken = async (token: string) => {
  const tokenRecord = await tokenRepo.findByToken(token)

  return TokenValidator.validate(tokenRecord, TokenType.UserInvite)
}

const acceptInvite = async (
  { token, password }: AcceptInviteParams,
  deviceInfo: DeviceInfo,
) => {
  const validatedToken = await validateToken(token)

  await db.transaction(async (tx) => {
    // Mark token as used
    await tokenRepo.update(validatedToken.id, {
      status: TokenStatus.Used,
      usedAt: new Date(),
    }, tx)

    // Update user's password
    const passwordHash = await hashPassword(password)
    await authRepo.update(validatedToken.userId, { passwordHash }, tx)

    // Activate user
    await userRepo.update(validatedToken.userId, { status: Status.Active }, tx)
  })

  const user = await userRepo.findById(validatedToken.userId)

  if (!user) {
    throw new AppError(ErrorCode.InternalError, 'User not found after accepting invite')
  }

  const [team, permissions] = await Promise.all([
    teamRepo.findUserTeam(user.id),
    resolvePermissions(user.id, user.role),
  ])

  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken(user, permissions),
    createRefreshToken(user.id, deviceInfo),
  ])

  return {
    data: { user, team, accessToken, permissions },
    refreshToken,
  }
}

export default acceptInvite
