import type { DeviceInfo } from '@/net/http/device'
import type { UserPreferences } from '@/types'

import { authRepo, db, tokenRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { logger } from '@/logging'
import { hashPassword } from '@/security/password'
import { generateToken, TokenType } from '@/security/token'
import { emailAgent } from '@/services'
import { AuthProvider, Status } from '@/types'

import { createAuthTokens } from '../tokens'

const createNewUser = async (
  firstName: string,
  lastName: string | undefined,
  email: string,
  password: string,
) => {
  const hashedPassword = await hashPassword(password)

  const { type, token: verificationToken, expiresAt } = generateToken(TokenType.EmailVerification)

  const newUser = await db.transaction(async (tx) => {
    const newUser = await userRepo.create({
      firstName,
      lastName,
      email,
      status: Status.New,
    }, tx)

    await authRepo.create({
      userId: newUser.id,
      provider: AuthProvider.Local,
      identifier: email,
      passwordHash: hashedPassword,
    }, tx)

    await tokenRepo.issue(newUser.id, {
      userId: newUser.id,
      type,
      token: verificationToken,
      expiresAt,
    }, tx)

    return newUser
  })

  return { newUser, verificationToken }
}

export interface SignupInput {
  firstName: string
  lastName?: string
  email: string
  password: string
}

export const signUpWithEmail = async (
  { firstName, lastName, email, password }: SignupInput,
  deviceInfo: DeviceInfo,
  preferences?: UserPreferences,
) => {
  // Check if user exists (outside transaction for fast fail)
  const existingUser = await userRepo.findByEmail(email)

  if (existingUser) {
    throw new AppError(ErrorCode.EmailAlreadyInUse)
  }

  // Create new user, verification token, etc. in a single transaction
  const { newUser, verificationToken } = await createNewUser(
    firstName,
    lastName,
    email,
    password,
  )

  // Send email verification (fire-and-forget, outside transaction)
  emailAgent.sendEmailVerificationEmail(
    newUser.firstName,
    newUser.email,
    verificationToken,
    preferences,
  ).catch((error: unknown) => {
    logger.error({ error }, `Failed to send email verification email to ${newUser.email}`)
  })

  const [accessToken, refreshToken] = await createAuthTokens(newUser, deviceInfo)

  return {
    data: { user: newUser, accessToken },
    refreshToken,
  }
}
