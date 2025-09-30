import type { User } from '@/repositories'

import db from '@/db'
import { AppError, ErrorCode } from '@/lib/catch'
import { createPasswordEncoder } from '@/lib/crypto'
import { emailAgent } from '@/lib/email-agent'
import jwt from '@/lib/jwt'
import logger from '@/lib/logger'
import { EMAIL_VERIFICATION_EXPIRY_HOURS, generateToken } from '@/lib/token'
import { normalizeUser } from '@/lib/user'
import { authRepo, tokenRepo, userRepo } from '@/repositories'
import { AuthProvider, Role, Status, Token } from '@/types'

export interface SignupParams {
  firstName: string
  lastName: string
  email: string
  password: string
}

const hashPassword = async (password: string) => {
  const encoder = createPasswordEncoder()

  return encoder.hash(password)
}

const createNewUser = async ({ firstName, lastName, email, password }: SignupParams) => {
  const hashedPassword = await hashPassword(password)

  const { type, token: verificationToken, expiresAt } = generateToken(Token.EmailVerification, { expiryHours: EMAIL_VERIFICATION_EXPIRY_HOURS })

  const newUser = await db.transaction(async (tx) => {
    const newUser = await userRepo.create({
      firstName,
      lastName,
      email,
      role: Role.User,
      status: Status.New,
    }, tx)

    await authRepo.create({
      userId: newUser.id,
      provider: AuthProvider.Local,
      identifier: email,
      passwordHash: hashedPassword,
    }, tx)

    await tokenRepo.deprecateOld(newUser.id, type, tx)

    await tokenRepo.create({
      userId: newUser.id,
      type,
      token: verificationToken,
      expiresAt,
    }, tx)

    return newUser
  })

  return { newUser, verificationToken }
}

const signJwt = async (user: User) => jwt.sign(
  user.id,
  user.email,
  user.role,
  user.status,
  user.tokenVersion,
)

const signUpWithEmail = async (
  { firstName, lastName, email, password }: SignupParams,
) => {
  // Check if user exists (outside transaction for fast fail)
  const existingUser = await userRepo.findByEmail(email)

  if (existingUser) {
    throw new AppError(ErrorCode.EmailAlreadyInUse)
  }

  // Create new user, verification token, etc. in a single transaction
  const { newUser, verificationToken } = await createNewUser({
    firstName,
    lastName,
    email,
    password,
  })

  // Send welcome email (fire-and-forget, outside transaction)
  emailAgent.sendWelcomeEmail({
    firstName: newUser.firstName,
    email: newUser.email,
    token: verificationToken,
  }).catch((error) => {
    logger.error({ error }, `Failed to send welcome email to ${newUser.email}`)
  })

  const jwtToken = await signJwt(newUser)

  return { user: normalizeUser(newUser), token: jwtToken }
}

export default signUpWithEmail
