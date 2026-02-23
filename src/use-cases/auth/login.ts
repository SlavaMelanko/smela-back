import type { User } from '@/data'
import type { DeviceInfo } from '@/net/http/device'
import type { Permission } from '@/types'

import { authRepo, refreshTokenRepo, teamRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { signJwt } from '@/security/jwt'
import { comparePasswordHashes } from '@/security/password'
import { generateHashedToken, TokenType } from '@/security/token'

import { resolvePermissions } from '../resolve-permissions'

export interface LoginParams {
  email: string
  password: string
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

const logInWithEmail = async (
  { email, password }: LoginParams,
  deviceInfo: DeviceInfo,
) => {
  const user = await userRepo.findByEmail(email)

  if (!user) {
    throw new AppError(ErrorCode.InvalidCredentials)
  }

  const auth = await authRepo.findById(user.id)

  if (!auth || !auth.passwordHash) {
    throw new AppError(ErrorCode.InvalidCredentials)
  }

  const isPasswordValid = await comparePasswordHashes(password, auth.passwordHash)

  if (!isPasswordValid) {
    throw new AppError(ErrorCode.InvalidCredentials)
  }

  const [team, permissions] = await Promise.all([
    teamRepo.findUserTeam(user.id),
    resolvePermissions(user.id, user.role),
  ])

  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken(user, permissions),
    createRefreshToken(user.id, deviceInfo),
  ])

  return {
    data: { user, team, accessToken, permissions },
    refreshToken,
  }
}

export default logInWithEmail
