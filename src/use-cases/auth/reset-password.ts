import type { User } from '@/data'
import type { DeviceInfo } from '@/net/http/device'

import { authRepo, db, refreshTokenRepo, tokenRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { signJwt } from '@/security/jwt'
import { hashPassword } from '@/security/password'
import {
  generateHashedToken,
  TokenStatus,
  TokenType,
  TokenValidator,
} from '@/security/token'

interface ResetPasswordParams {
  token: string
  password: string
  deviceInfo: DeviceInfo
}

const validateToken = async (token: string) => {
  const tokenRecord = await tokenRepo.findByToken(token)

  return TokenValidator.validate(tokenRecord, TokenType.PasswordReset)
}

const createAccessToken = async (user: User) => signJwt({
  id: user.id,
  email: user.email,
  role: user.role,
  status: user.status,
})

const createRefreshToken = async (userId: number, deviceInfo: DeviceInfo) => {
  const { token: { raw, hashed }, expiresAt } = await generateHashedToken(
    TokenType.RefreshToken,
  )

  await refreshTokenRepo.create({
    userId,
    tokenHash: hashed,
    ipAddress: deviceInfo.ipAddress,
    userAgent: deviceInfo.userAgent,
    expiresAt,
  })

  return raw
}

const resetPassword = async (
  { token, password, deviceInfo }: ResetPasswordParams,
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

  const accessToken = await createAccessToken(user)
  const refreshToken = await createRefreshToken(user.id, deviceInfo)

  return {
    data: { user, accessToken },
    refreshToken,
  }
}

export default resetPassword
