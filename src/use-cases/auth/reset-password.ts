import type { DeviceInfo } from '@/net/http/device'

import { authRepo, db, teamRepo, tokenRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { hashPassword } from '@/security/password'
import { TokenStatus, TokenType, TokenValidator } from '@/security/token'

import { createAccessToken, createRefreshToken } from '../create-tokens'

export interface ResetPasswordParams {
  token: string
  password: string
}

const validateToken = async (token: string) => {
  const tokenRecord = await tokenRepo.findByToken(token)

  return TokenValidator.validate(tokenRecord, TokenType.PasswordReset)
}

const resetPassword = async (
  { token, password }: ResetPasswordParams,
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
  })

  const user = await userRepo.findById(validatedToken.userId)

  if (!user) {
    throw new AppError(ErrorCode.InternalError, 'User not found after password reset')
  }

  const [accessToken, refreshToken, team] = await Promise.all([
    createAccessToken(user),
    createRefreshToken(user.id, deviceInfo),
    teamRepo.findUserTeam(user.id),
  ])

  return {
    data: { user, team, accessToken },
    refreshToken,
  }
}

export default resetPassword
