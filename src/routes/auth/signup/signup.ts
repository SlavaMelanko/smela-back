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

const createUser = async ({ firstName, lastName, email, password }: SignupParams) => {
  const newUser = await userRepo.create({
    firstName,
    lastName,
    email,
    role: Role.User,
    status: Status.New,
  })

  if (!newUser) {
    throw new AppError(ErrorCode.InternalError)
  }

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
  { firstName, lastName, email, password }: SignupParams,
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
  })

  const secureToken = await createEmailVerificationToken(newUser.id)

  emailAgent.sendWelcomeEmail({
    firstName: newUser.firstName,
    email: newUser.email,
    token: secureToken,
  }).catch((error) => {
    logger.error({ error }, `Failed to send welcome email to ${newUser.email}`)
  })

  const jwtToken = await jwt.sign(
    newUser.id,
    newUser.email,
    newUser.role,
    newUser.status,
    newUser.tokenVersion,
  )

  return { user: normalizeUser(newUser), token: jwtToken }
}

export default signUpWithEmail
