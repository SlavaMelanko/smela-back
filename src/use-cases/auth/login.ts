import type { DeviceInfo } from '@/net/http/device'

import { authRepo, teamRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { comparePasswordHashes } from '@/security/password'

import { createAuthTokens } from '../tokens'

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

  const [team, [accessToken, refreshToken]] = await Promise.all([
    teamRepo.findUserTeam(user.id),
    createAuthTokens(user, deviceInfo),
  ])

  return {
    data: { user, team, accessToken },
    refreshToken,
  }
}

export default logInWithEmail
