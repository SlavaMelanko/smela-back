import type { DeviceInfo } from '@/net/http/device'

import { authRepo, teamRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { comparePasswordHashes } from '@/security/password'

import { createAccessToken, createRefreshToken } from '../create-tokens'
import { resolvePermissions } from '../resolve-permissions'

export interface LoginParams {
  email: string
  password: string
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
