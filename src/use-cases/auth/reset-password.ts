import type { DeviceInfo } from '@/net/http/device'

import { authRepo, db, teamRepo, tokenRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { hashPassword } from '@/security/password'
import { TokenStatus, TokenType } from '@/security/token'

import { resolvePermissionList } from '../resolve-permissions'
import { createAuthTokens, validateOneTimeToken } from '../tokens'

export interface ResetPasswordInput {
  token: string
  password: string
}

export const resetPassword = async (
  { token, password }: ResetPasswordInput,
  deviceInfo: DeviceInfo,
) => {
  const validatedToken = await validateOneTimeToken(token, TokenType.PasswordReset)

  await db.transaction(async (tx) => {
    // Mark token as used
    await tokenRepo.update(validatedToken.id, {
      status: TokenStatus.Used,
      usedAt: new Date(),
    }, tx)

    // Update user's password
    const passwordHash = await hashPassword(password)
    await authRepo.update(validatedToken.userId, { passwordHash }, tx)
  })

  const user = await userRepo.findById(validatedToken.userId)

  if (!user) {
    throw new AppError(ErrorCode.InternalError, 'User not found after password reset')
  }

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
