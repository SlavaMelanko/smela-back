import type { User } from '@/repositories'

import { AppError, ErrorCode } from '@/lib/catch'
import { createPasswordEncoder } from '@/lib/crypto'
import jwt from '@/lib/jwt'
import { normalizeUser } from '@/lib/user'
import { authRepo, userRepo } from '@/repositories'

interface LoginParams {
  email: string
  password: string
}

const comparePasswords = async (password: string, hashedPassword: string) => {
  if (!password || !hashedPassword) {
    return false
  }

  const encoder = createPasswordEncoder()

  return await encoder.compare(password, hashedPassword)
}

const signJwt = async (user: User) => jwt.sign(
  user.id,
  user.email,
  user.role,
  user.status,
  user.tokenVersion,
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

  const token = await signJwt(user)

  return { user: normalizeUser(user), token }
}

export default logInWithEmail
