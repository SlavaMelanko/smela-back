import type { Database, User } from '@/data'
import type { DeviceInfo } from '@/net/http/device'
import type { Permission } from '@/types'

import { refreshTokenRepo, tokenRepo } from '@/data'
import env from '@/env'
import { signJwt } from '@/security/jwt'
import { generateHashedToken, TokenType, TokenValidator } from '@/security/token'

export const createAccessToken = async (user: User, permissions?: Permission[]) => signJwt({
  id: user.id,
  email: user.email,
  role: user.role,
  status: user.status,
  permissions,
})

export const createRefreshToken = async (
  userId: string,
  deviceInfo: DeviceInfo,
  tx?: Database,
) => {
  const { token: { raw, hashed }, expiresAt } = await generateHashedToken(
    TokenType.RefreshToken,
    { expirySeconds: env.COOKIE_REFRESH_TOKEN_EXPIRATION },
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

export const createAuthTokens = async (
  user: User,
  deviceInfo: DeviceInfo,
  permissions?: Permission[],
  tx?: Database,
) => Promise.all([
  createAccessToken(user, permissions),
  createRefreshToken(user.id, deviceInfo, tx),
])

export const validateOneTimeToken = async (token: string, type: TokenType) => {
  const tokenRecord = await tokenRepo.findByToken(token)

  return TokenValidator.validate(tokenRecord, type)
}
