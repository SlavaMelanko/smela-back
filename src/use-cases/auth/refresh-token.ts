import type { DeviceInfo } from '@/net/http/device'

import { db, refreshTokenRepo, teamRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { logger } from '@/logging'
import { hashToken } from '@/security/token'

import { createAccessToken, createRefreshToken } from '../create-tokens'
import { resolvePermissions } from '../resolve-permissions'

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

  const [team, permissions, newRefreshToken] = await Promise.all([
    teamRepo.findUserTeam(user.id),
    resolvePermissions(user.id, user.role),
    db.transaction(async (tx) => {
      const newRefreshToken = await createRefreshToken(user.id, deviceInfo, tx)

      // Revoke old token last to prevent user lockout on failures
      await refreshTokenRepo.revokeByHash(hashedToken, tx)

      return newRefreshToken
    }),
  ])

  const accessToken = await createAccessToken(user, permissions)

  return {
    data: { user, team, accessToken, permissions },
    refreshToken: newRefreshToken,
  }
}

export default refreshAuthTokens
