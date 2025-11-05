import type { Database, User } from '@/data'

import { db, refreshTokenRepo, tokenRepo, userRepo } from '@/data'
import { signJwt } from '@/security/jwt'
import { generateHashedToken, TokenStatus, TokenType, TokenValidator } from '@/security/token'
import { Status } from '@/types'

export interface VerifyEmailResult {
  data: {
    user: User
    accessToken: string
  }
  refreshToken: string
}

const validateToken = async (token: string) => {
  const tokenRecord = await tokenRepo.findByToken(token)

  return TokenValidator.validate(tokenRecord, TokenType.EmailVerification)
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

const verifyEmail = async (token: string): Promise<VerifyEmailResult> => {
  const validatedToken = await validateToken(token)

  const updatedUser = await db.transaction(async (tx) => {
    // Mark token as used
    await tokenRepo.update(validatedToken.id, {
      status: TokenStatus.Used,
      usedAt: new Date(),
    }, tx)

    // Update user status
    return userRepo.update(validatedToken.userId, { status: Status.Verified }, tx)
  })

  const accessToken = await createAccessToken(updatedUser)
  const refreshToken = await createRefreshToken(updatedUser.id)

  return { data: { user: updatedUser, accessToken }, refreshToken }
}

export default verifyEmail
