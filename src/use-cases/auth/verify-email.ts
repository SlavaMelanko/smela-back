import type { User } from '@/data'
import type { DeviceInfo } from '@/net/http/device'
import type { Permission } from '@/types'

import { db, refreshTokenRepo, teamRepo, tokenRepo, userRepo } from '@/data'
import { signJwt } from '@/security/jwt'
import { generateHashedToken, TokenStatus, TokenType, TokenValidator } from '@/security/token'
import { Status } from '@/types'

import { resolvePermissions } from '../resolve-permissions'

export interface VerifyEmailParams {
  token: string
}

const validateToken = async (token: string) => {
  const tokenRecord = await tokenRepo.findByToken(token)

  return TokenValidator.validate(tokenRecord, TokenType.EmailVerification)
}

const createAccessToken = async (user: User, permissions: Permission[]) => signJwt(
  {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    permissions,
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

  const [team, permissions] = await Promise.all([
    teamRepo.findUserTeam(updatedUser.id),
    resolvePermissions(updatedUser.id, updatedUser.role),
  ])

  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken(updatedUser, permissions),
    createRefreshToken(updatedUser.id, deviceInfo),
  ])

  return {
    data: { user: updatedUser, team, accessToken, permissions },
    refreshToken,
  }
}

export default verifyEmail
