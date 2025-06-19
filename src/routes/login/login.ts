import { StatusCodes } from 'http-status-codes'

import { createPasswordEncoder } from '@/lib/crypto'
import HttpError from '@/lib/http-error'
import jwt from '@/lib/jwt'
import { userRepo } from '@/repositories'

interface LoginParams {
  email: string
  password: string
}

const comparePasswords = async (password: string, hashedPassword: string) => {
  const encoder = createPasswordEncoder()

  return await encoder.compare(password, hashedPassword)
}

const logIn = async ({ email, password }: LoginParams) => {
  const user = await userRepo.findByEmail(email)

  if (!user) {
    throw new HttpError(StatusCodes.UNAUTHORIZED)
  }

  const isPasswordValid = await comparePasswords(password, user.password)

  if (!isPasswordValid) {
    throw new HttpError(StatusCodes.UNAUTHORIZED)
  }

  return jwt.sign(user.id, user.email, 'user')
}

export default logIn
