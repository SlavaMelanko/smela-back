import type { DeviceInfo } from '@/net/http/device'

import { authRepo, teamRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { comparePasswordHashes } from '@/security/password'

import { resolvePermissionList } from '../resolve-permissions'
import { createAuthTokens } from '../tokens'

export interface LoginInput {
  email: string
  password: string
}

export const logInWithEmail = async (
  { email, password }: LoginInput,
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
    resolvePermissionList(user.id),
  ])

  const [accessToken, refreshToken] = await createAuthTokens(user, deviceInfo, permissions)

  return {
    data: { user, team, permissions, accessToken },
    refreshToken,
  }
}
