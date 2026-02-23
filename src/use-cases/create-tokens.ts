import type { Database, User } from '@/data'
import type { DeviceInfo } from '@/net/http/device'

import { refreshTokenRepo } from '@/data'
import { signJwt } from '@/security/jwt'
import { generateHashedToken, TokenType } from '@/security/token'

export const createAccessToken = async (user: User) => signJwt({
  id: user.id,
  email: user.email,
  role: user.role,
  status: user.status,
})

export const createRefreshToken = async (
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
