import type { Role } from '@/types'

import { createPasswordEncoder, generateToken } from '@/lib/crypto'
import { emailAgent } from '@/lib/email-agent'
import { AppError, ErrorCode } from '@/lib/errors'
import { EMAIL_VERIFICATION_EXPIRY_HOURS } from '@/lib/token-consts'
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
  const { type, token, expiresAt } = generateToken(Token.EmailVerification, { expiryHours: EMAIL_VERIFICATION_EXPIRY_HOURS })

  await tokenRepo.deprecateOld(userId, type)
  await tokenRepo.create({ userId, type, token, expiresAt })

  return token
}

const signUpWithEmail = async (
  { firstName, lastName, email, password, role }: SignupParams,
) => {
  const existingUser = await userRepo.findByEmail(email)

  if (existingUser) {
    throw new AppError(ErrorCode.EmailAlreadyInUse)
  }

  const newUser = await createUser({
    firstName,
    lastName,
    email,
    password,
    role,
  })

  const token = await createEmailVerificationToken(newUser.id)

  await emailAgent.sendWelcomeEmail({
    firstName: newUser.firstName,
    email: newUser.email,
    token,
  })

  return newUser
}

export default signUpWithEmail
