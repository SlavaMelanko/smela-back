import type { User } from '@/data'

import { authRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { signJwt } from '@/security/jwt'
import { comparePasswords } from '@/security/password'

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
  },
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

  return { user, token }
}

export default logInWithEmail
