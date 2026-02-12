import type { Database, User } from '@/data'
import type { DeviceInfo } from '@/net/http/device'

import { db, refreshTokenRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { logger } from '@/logging'
import { signJwt } from '@/security/jwt'
import { generateHashedToken, hashToken, TokenType } from '@/security/token'

const validateToken = async (refreshToken: string | undefined) => {
  if (!refreshToken) {
    throw new AppError(ErrorCode.MissingRefreshToken)
  }

  const hashedToken = await hashToken(refreshToken)
  const storedToken = await refreshTokenRepo.findByHash(hashedToken)

  if (!storedToken) {
    throw new AppError(ErrorCode.InvalidRefreshToken)
  }

  if (storedToken.revokedAt) {
    throw new AppError(ErrorCode.RefreshTokenRevoked)
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AppError(ErrorCode.RefreshTokenExpired)
  }

  return { storedToken, hashedToken }
}

const createAccessToken = async (user: User) => signJwt(
  {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  },
)

const createRefreshToken = async (
  userId: string,
  deviceInfo: DeviceInfo,
  tx?: Database,
) => {
  const { token: { raw, hashed }, expiresAt } = await generateHashedToken(
    TokenType.RefreshToken,
  )

  await refreshTokenRepo.create({
    userId,
    tokenHash: hashed,
    ipAddress: deviceInfo.ipAddress,
    userAgent: deviceInfo.userAgent,
    expiresAt,
  }, tx)

  return raw
}

const validateDevice = (
  storedToken: { ipAddress: string | null, userAgent: string | null },
  deviceInfo: DeviceInfo,
  userId: string,
) => {
  const ipChanged = storedToken.ipAddress !== deviceInfo.ipAddress
  const userAgentChanged = storedToken.userAgent !== deviceInfo.userAgent

  if (ipChanged || userAgentChanged) {
    logger.warn({
      userId,
      oldIp: storedToken.ipAddress,
      newIp: deviceInfo.ipAddress,
      oldUserAgent: storedToken.userAgent,
      newUserAgent: deviceInfo.userAgent,
    }, 'Device change detected during token refresh')
  }
}

const refreshAuthTokens = async (
  refreshToken: string | undefined,
  deviceInfo: DeviceInfo,
) => {
  const { storedToken, hashedToken } = await validateToken(refreshToken)

  const user = await userRepo.findById(storedToken.userId)

  if (!user) {
    throw new AppError(ErrorCode.InvalidRefreshToken)
  }

  validateDevice(storedToken, deviceInfo, user.id)

  return db.transaction(async (tx) => {
    // Create new tokens first (OAuth 2.0 best practice)
    const accessToken = await createAccessToken(user)
    const newRefreshToken = await createRefreshToken(user.id, deviceInfo, tx)

    // Revoke old token last to prevent user lockout on failures
    await refreshTokenRepo.revokeByHash(hashedToken, tx)

    return {
      data: { user, accessToken },
      refreshToken: newRefreshToken,
    }
  })
}

export default refreshAuthTokens
