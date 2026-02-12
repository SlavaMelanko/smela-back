import type { User } from '@/data'
import type { DeviceInfo } from '@/net/http/device'

import { db, refreshTokenRepo, tokenRepo, userRepo } from '@/data'
import { signJwt } from '@/security/jwt'
import { generateHashedToken, TokenStatus, TokenType, TokenValidator } from '@/security/token'
import { Status } from '@/types'

export interface VerifyEmailParams {
  token: string
}

const validateToken = async (token: string) => {
  const tokenRecord = await tokenRepo.findByToken(token)

  return TokenValidator.validate(tokenRecord, TokenType.EmailVerification)
}

const createAccessToken = async (user: User) => signJwt(
  {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  },
)

const createRefreshToken = async (userId: string, deviceInfo: DeviceInfo) => {
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

const verifyEmail = async ({ token }: VerifyEmailParams, deviceInfo: DeviceInfo) => {
  const validatedToken = await validateToken(token)

  const updatedUser = await db.transaction(async (tx) => {
    // Mark token as used
    await tokenRepo.update(validatedToken.id, {
      status: TokenStatus.Used,
      usedAt: new Date(),
    }, tx)

    // Update user status
    return userRepo.update(validatedToken.userId, { status: Status.Verified }, tx)
  })

  const accessToken = await createAccessToken(updatedUser)
  const refreshToken = await createRefreshToken(updatedUser.id, deviceInfo)

  return {
    data: { user: updatedUser, accessToken },
    refreshToken,
  }
}

export default verifyEmail
