import type { User } from '@/data'

import { authRepo, db, tokenRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { logger } from '@/logging'
import { signJwt } from '@/security/jwt'
import { hashPassword } from '@/security/password'
import { generateToken, TokenType } from '@/security/token'
import { emailAgent } from '@/services'
import { AuthProvider, Role, Status } from '@/types'

export interface SignupParams {
  firstName: string
  lastName?: string
  email: string
  password: string
}

const createNewUser = async ({ firstName, lastName, email, password }: SignupParams) => {
  const hashedPassword = await hashPassword(password)

  const { type, token: verificationToken, expiresAt } = generateToken(TokenType.EmailVerification)

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

    await tokenRepo.replace(newUser.id, {
      userId: newUser.id,
      type,
      token: verificationToken,
      expiresAt,
    }, tx)

    return newUser
  })

  return { newUser, verificationToken }
}

const createJwtToken = async (user: User) => signJwt(
  {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  },
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
  }).catch((error: unknown) => {
    logger.error({ error }, `Failed to send welcome email to ${newUser.email}`)
  })

  const jwtToken = await createJwtToken(newUser)

  return {
    data: { user: newUser },
    accessToken: jwtToken,
  }
}

export default signUpWithEmail
