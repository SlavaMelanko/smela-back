import type { User } from '@/data'
import type { DeviceInfo } from '@/net/http/device'

import { authRepo, rbacRepo, refreshTokenRepo, teamRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { signJwt } from '@/security/jwt'
import { comparePasswordHashes } from '@/security/password'
import { generateHashedToken, TokenType } from '@/security/token'
import { Action, Resource, Role } from '@/types'

const ALL_PERMISSIONS = Object.values(Action).flatMap(action =>
  Object.values(Resource).map(resource => `${action}:${resource}`),
)

const specifyPermissions = async (userId: string, role: Role): Promise<string[]> => {
  if (role === Role.Owner) {
    return ALL_PERMISSIONS
  }

  const rows = await rbacRepo.findUserPermissions(userId, role)

  return rows
    .filter(row => row.override === true || (row.override === null && row.default))
    .map(row => `${row.action}:${row.resource}`)
}

export interface LoginParams {
  email: string
  password: string
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

  const [accessToken, refreshToken, team, permissions] = await Promise.all([
    createAccessToken(user),
    createRefreshToken(user.id, deviceInfo),
    teamRepo.findUserTeam(user.id),
    specifyPermissions(user.id, user.role),
  ])

  return {
    data: { user, team: team ?? null, accessToken, permissions },
    refreshToken,
  }
}

export default logInWithEmail
