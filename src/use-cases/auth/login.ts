import type { Database, User } from '@/data'

import { authRepo, refreshTokenRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { signJwt } from '@/security/jwt'
import { comparePasswords } from '@/security/password'
import { generateHashedToken, TokenType } from '@/security/token'

export interface LoginParams {
  email: string
  password: string
}

const createAccessToken = async (user: User) => signJwt(
  {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  },
)

const createRefreshToken = async (userId: number, tx?: Database) => {
  const { token: { raw, hashed }, expiresAt } = await generateHashedToken(
    TokenType.RefreshToken,
  )

  await refreshTokenRepo.create({
    userId,
    tokenHash: hashed,
    expiresAt,
  }, tx)

  return raw
}

const logInWithEmail = async ({ email, password }: LoginParams) => {
  const user = await userRepo.findByEmail(email)

  if (!user) {
    throw new AppError(ErrorCode.InvalidCredentials)
  }

  const auth = await authRepo.findById(user.id)

  if (!auth || !auth.passwordHash) {
    throw new AppError(ErrorCode.InvalidCredentials)
  }

  const isPasswordValid = await comparePasswords(password, auth.passwordHash)

  if (!isPasswordValid) {
    throw new AppError(ErrorCode.BadCredentials)
  }

  const accessToken = await createAccessToken(user)
  const refreshToken = await createRefreshToken(user.id)

  return { data: { user, accessToken }, refreshToken }
}

export default logInWithEmail
