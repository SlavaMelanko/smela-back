import type { Role, Status } from '@/types'

import { jwt } from '@/lib/auth'
import { createPasswordEncoder } from '@/lib/crypto'
import { AppError, ErrorCode } from '@/lib/errors'
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

  return jwt.sign(user.id, user.email, user.role as Role, user.status as Status, user.tokenVersion)
}

export default logInWithEmail
