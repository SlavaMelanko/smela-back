import type { User } from '@/data'

import { authRepo, normalizeUser, userRepo } from '@/data'
import env from '@/env'
import { signJwt } from '@/jwt'
import { AppError, ErrorCode } from '@/lib/catch'
import { comparePasswords } from '@/lib/cipher'

export interface LoginParams {
  email: string
  password: string
}

const createJwtToken = async (user: User) => signJwt(
  {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    tokenVersion: user.tokenVersion,
  },
  { secret: env.JWT_ACCESS_SECRET },
)

const logInWithEmail = async ({ email, password }: LoginParams) => {
  const user = await userRepo.findByEmail(email)

  if (!user) {
    throw new AppError(ErrorCode.InvalidCredentials)
  }

  const auth = await authRepo.findById(user.id)

  if (!auth || !auth.passwordHash) {
    throw new AppError(ErrorCode.InvalidCredentials)
  }

  const isPasswordValid = await comparePasswords(password, auth.passwordHash)

  if (!isPasswordValid) {
    throw new AppError(ErrorCode.BadCredentials)
  }

  const token = await createJwtToken(user)

  return { user: normalizeUser(user), token }
}

export default logInWithEmail
