import { StatusCodes } from 'http-status-codes'

import type { Role } from '@/types'

import { createPasswordEncoder, createTokenGenerator } from '@/lib/crypto'
import { sendWelcomeEmail } from '@/lib/emails'
import HttpError from '@/lib/http-error'
import { authRepo, tokenRepo, userRepo } from '@/repositories'
import { AuthProvider, Status, Token } from '@/types'

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
  const tokenGenerator = createTokenGenerator()
  const { token, expiresAt } = tokenGenerator.generateWithExpiry()
  const type = Token.EmailVerification

  await tokenRepo.deprecateOld(userId, type)
  await tokenRepo.create({ userId, type, token, expiresAt })

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

  const token = await createEmailVerificationToken(newUser.id)

  sendWelcomeEmail({
    firstName: newUser.firstName,
    email: newUser.email,
    token,
  })

  return newUser
}

export default signUpWithEmail
