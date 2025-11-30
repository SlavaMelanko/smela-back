import type { User } from '@/data'
import type { DeviceInfo } from '@/net/http/device'
import type { UserPreferences } from '@/types'

import { authRepo, db, refreshTokenRepo, tokenRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { logger } from '@/logging'
import { signJwt } from '@/security/jwt'
import { hashPassword } from '@/security/password'
import { generateHashedToken, generateToken, TokenType } from '@/security/token'
import { emailAgent } from '@/services'
import { AuthProvider, Role, Status } from '@/types'

export interface SignupParams {
  firstName: string
  lastName?: string
  email: string
  password: string
}

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

const createAccessToken = async (user: User) => signJwt(
  {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  },
)

const createRefreshToken = async (userId: number, deviceInfo: DeviceInfo) => {
  const { token: { raw, hashed }, expiresAt } = await generateHashedToken(
    TokenType.RefreshToken,
  )

  await refreshTokenRepo.create({
    userId,
    tokenHash: hashed,
    ipAddress: deviceInfo.ipAddress,
    userAgent: deviceInfo.userAgent,
    expiresAt,
  })

  return raw
}

const signUpWithEmail = async (
  { firstName, lastName, email, password }: SignupParams,
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

  const accessToken = await createAccessToken(newUser)
  const refreshToken = await createRefreshToken(newUser.id, deviceInfo)

  return {
    data: { user: newUser, accessToken },
    refreshToken,
  }
}

export default signUpWithEmail
