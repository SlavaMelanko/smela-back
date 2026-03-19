import type { DeviceInfo } from '@/net/http/device'

import { db, refreshTokenRepo, teamRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { logger } from '@/logging'
import { hashToken } from '@/security/token'

import { resolvePermissionList } from '../resolve-permissions'
import { createAccessToken, createRefreshToken } from '../tokens'

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

export interface RefreshAuthTokensInput {
  refreshToken: string | undefined
}

export const refreshAuthTokens = async (
  { refreshToken }: RefreshAuthTokensInput,
  deviceInfo: DeviceInfo,
) => {
  const { storedToken, hashedToken } = await validateToken(refreshToken)

  const [user, team] = await Promise.all([
    userRepo.findById(storedToken.userId),
    teamRepo.findUserTeam(storedToken.userId),
  ])

  if (!user) {
    throw new AppError(ErrorCode.InvalidRefreshToken)
  }

  validateDevice(storedToken, deviceInfo, user.id)

  const permissions = await resolvePermissionList(user.id)

  const [accessToken, newRefreshToken] = await Promise.all([
    createAccessToken(user, permissions),
    db.transaction(async (tx) => {
      // Create new refresh token first (OAuth 2.0 best practice)
      const newRefreshToken = await createRefreshToken(user.id, deviceInfo, tx)
      // Revoke old token last to prevent user lockout on failures
      await refreshTokenRepo.revokeByHash(hashedToken, tx)

      return newRefreshToken
    }),
  ])

  return {
    data: { user, team, permissions, accessToken },
    refreshToken: newRefreshToken,
  }
}
