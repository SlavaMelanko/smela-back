import type { Database, User } from '@/data'
import type { DeviceInfo } from '@/net/http'

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
  deviceInfo?: DeviceInfo
}

const createNewUser = async ({ firstName, lastName, email, password }: SignupParams) => {
  const hashedPassword = await hashPassword(password)

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

    return newUser
  })

  return newUser
}

const createAccessToken = async (user: User) => signJwt(
  {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  },
)

const createRefreshToken = async (
  userId: number,
  deviceInfo?: DeviceInfo,
  tx?: Database,
) => {
  const { token: { raw, hashed }, expiresAt } = await generateHashedToken(
    TokenType.RefreshToken,
  )

  await refreshTokenRepo.create({
    userId,
    tokenHash: hashed,
    expiresAt,
    ...(deviceInfo && {
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
    }),
  }, tx)

  return raw
}

const signUpWithEmail = async (
  { firstName, lastName, email, password, deviceInfo }: SignupParams,
) => {
  // Check if user exists (outside transaction for fast fail)
  const existingUser = await userRepo.findByEmail(email)

  if (existingUser) {
    throw new AppError(ErrorCode.EmailAlreadyInUse)
  }

  // Create new user in transaction
  const newUser = await createNewUser({
    firstName,
    lastName,
    email,
    password,
  })

  // Generate verification token outside transaction
  const { type, token: verificationToken, expiresAt } = generateToken(TokenType.EmailVerification)

  await db.transaction(async (tx) => {
    await tokenRepo.replace(newUser.id, {
      userId: newUser.id,
      type,
      token: verificationToken,
      expiresAt,
    }, tx)
  })

  // Send welcome email (fire-and-forget)
  emailAgent.sendWelcomeEmail({
    firstName: newUser.firstName,
    email: newUser.email,
    token: verificationToken,
  }).catch((error: unknown) => {
    logger.error({ error }, `Failed to send welcome email to ${newUser.email}`)
  })

  // Generate tokens
  const accessToken = await createAccessToken(newUser)
  const refreshToken = await createRefreshToken(newUser.id, deviceInfo)

  return { data: { user: newUser, accessToken }, refreshToken }
}

export default signUpWithEmail
