import { StatusCodes } from 'http-status-codes'

import { createPasswordEncoder } from '@/lib/crypto'
import HttpError from '@/lib/http-error'
import { userRepo } from '@/repositories'

const hashPassword = async (password: string) => {
  const encoder = createPasswordEncoder()

  return await encoder.hash(password)
}

const signUp = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
) => {
  const existingUser = await userRepo.findByEmail(email)
  if (existingUser) {
    throw new HttpError(StatusCodes.CONFLICT)
  }

  const hashedPassword = await hashPassword(password)
  const newUser = await userRepo.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
  })

  return newUser
}

export default signUp
