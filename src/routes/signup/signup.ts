import { StatusCodes } from 'http-status-codes'

import type { Role } from '@/types'

import { createPasswordEncoder } from '@/lib/crypto'
import HttpError from '@/lib/http-error'
import { authRepo, roleRepo, userRepo } from '@/repositories'
import { AuthProvider } from '@/types'

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

const signUpWithEmail = async (
  { firstName, lastName, email, password, role }: SignupParams,
) => {
  const existingUser = await userRepo.findByEmail(email)

  if (existingUser) {
    throw new HttpError(StatusCodes.CONFLICT)
  }

  const roleId = await roleRepo.getIdByName(role)

  const newUser = await userRepo.create({
    firstName,
    lastName,
    email,
    roleId,
  })

  const hashedPassword = await hashPassword(password)

  await authRepo.create({
    userId: newUser.id,
    provider: AuthProvider.Local,
    identifier: email,
    passwordHash: hashedPassword,
  })

  return newUser
}

export default signUpWithEmail
