import { StatusCodes } from 'http-status-codes'

import { createPasswordEncoder } from '@/lib/crypto'
import HttpError from '@/lib/http-error'
import jwt from '@/lib/jwt'
import { authRepo, userRepo } from '@/repositories'

interface LoginParams {
  email: string
  password: string
}

const comparePasswords = async (password: string, hashedPassword: string) => {
  const encoder = createPasswordEncoder()

  return await encoder.compare(password, hashedPassword)
}

const logInWithEmail = async ({ email, password }: LoginParams) => {
  const user = await userRepo.findByEmail(email)

  if (!user) {
    throw new HttpError(StatusCodes.UNAUTHORIZED)
  }

  const auth = await authRepo.findById(user.id)

  if (!auth) {
    throw new HttpError(StatusCodes.UNAUTHORIZED)
  }

  const isPasswordValid = await comparePasswords(password, auth.passwordHash!)

  if (!isPasswordValid) {
    throw new HttpError(StatusCodes.UNAUTHORIZED)
  }

  return jwt.sign(user.id, user.email, user.role, user.status)
}

export default logInWithEmail
