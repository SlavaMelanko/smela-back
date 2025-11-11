import type { User } from '@/data'
import type { DeviceInfo } from '@/net/http/device'

import { refreshTokenRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { logger } from '@/logging'
import { signJwt } from '@/security/jwt'
import { generateHashedToken, hashToken, TokenType } from '@/security/token'

export interface RefreshTokenParams {
  refreshToken: string | undefined
  deviceInfo: DeviceInfo
}

const createAccessToken = async (user: User) => signJwt(
  {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  },
)

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

const validateDeviceChange = (
  storedToken: { ipAddress: string | null, userAgent: string | null },
  deviceInfo: DeviceInfo,
  userId: number,
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

const refreshAuthTokens = async ({ refreshToken, deviceInfo }: RefreshTokenParams) => {
  if (!refreshToken) {
    throw new AppError(ErrorCode.MissingRefreshToken)
  }

  const tokenHash = await hashToken(refreshToken)
  const storedToken = await refreshTokenRepo.findByHash(tokenHash)

  if (!storedToken) {
    throw new AppError(ErrorCode.InvalidRefreshToken)
  }

  if (storedToken.revokedAt) {
    throw new AppError(ErrorCode.RefreshTokenRevoked)
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AppError(ErrorCode.RefreshTokenExpired)
  }

  const user = await userRepo.findById(storedToken.userId)

  if (!user) {
    throw new AppError(ErrorCode.InvalidRefreshToken)
  }

  validateDeviceChange(storedToken, deviceInfo, user.id)

  await refreshTokenRepo.revokeByHash(tokenHash)

  const accessToken = await createAccessToken(user)
  const newRefreshToken = await createRefreshToken(user.id, deviceInfo)

  return {
    data: { user, accessToken },
    refreshToken: newRefreshToken,
  }
}

export default refreshAuthTokens
