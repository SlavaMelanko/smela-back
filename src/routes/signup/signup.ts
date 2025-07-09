import { StatusCodes } from 'http-status-codes'

import type { Role } from '@/types'

import { createPasswordEncoder, createSecureTokenGenerator } from '@/lib/crypto'
import HttpError from '@/lib/http-error'
import { authRepo, secureTokenRepo, userRepo } from '@/repositories'
import { AuthProvider, SecureToken, Status } from '@/types'

interface SignupParams {
  firstName: string
  lastName: string
  email: string
  password: string
  role: Role
}

const createUser = async ({ firstName, lastName, email, password, role }: SignupParams) => {
  const newUser = await userRepo.create({
    firstName,
    lastName,
    email,
    role,
    status: Status.New,
  })

  const encoder = createPasswordEncoder()
  const hashedPassword = await encoder.hash(password)

  await authRepo.create({
    userId: newUser.id,
    provider: AuthProvider.Local,
    identifier: email,
    passwordHash: hashedPassword,
  })

  return newUser
}

const createEmailVerificationToken = async (userId: number) => {
  const tokenGenerator = createSecureTokenGenerator()
  const { token, expiresAt } = tokenGenerator.generateWithExpiry()

  await secureTokenRepo.create({
    userId,
    type: SecureToken.EmailVerification,
    token,
    expiresAt,
  })

  return token
}

const signUpWithEmail = async (
  { firstName, lastName, email, password, role }: SignupParams,
) => {
  const existingUser = await userRepo.findByEmail(email)

  if (existingUser) {
    throw new HttpError(StatusCodes.CONFLICT)
  }

  const newUser = await createUser({
    firstName,
    lastName,
    email,
    password,
    role,
  })

  await createEmailVerificationToken(newUser.id)

  return newUser
}

export default signUpWithEmail
