import { StatusCodes } from 'http-status-codes'

import type { Role } from '@/types'

import { createPasswordEncoder } from '@/lib/crypto'
import HttpError from '@/lib/http-error'
import { roleRepo, userRepo } from '@/repositories'

interface SignupParams {
  firstName: string
  lastName: string
  email: string
  password: string
  role: Role
}

const hashPassword = async (password: string) => {
  const encoder = createPasswordEncoder()

  return await encoder.hash(password)
}

const signUp = async (
  { firstName, lastName, email, password, role }: SignupParams,
) => {
  const existingUser = await userRepo.findByEmail(email)
  if (existingUser) {
    throw new HttpError(StatusCodes.CONFLICT)
  }

  const roleId = await roleRepo.getIdByName(role)

  const hashedPassword = await hashPassword(password)
  const newUser = await userRepo.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    roleId,
  })

  return newUser
}

export default signUp
