import type { User } from '@/data'

import { db, tokenRepo, userRepo } from '@/data'
import jwt from '@/lib/jwt'
import { TokenValidator } from '@/lib/token'
import { normalizeUser } from '@/lib/user'
import { Status, Token, TokenStatus } from '@/types'

export interface VerifyEmailResult {
  user: ReturnType<typeof normalizeUser>
  token: string
}

const validateToken = async (token: string) => {
  const tokenRecord = await tokenRepo.findByToken(token)

  return TokenValidator.validate(tokenRecord, Token.EmailVerification)
}

const signJwt = async (user: User) => jwt.sign(
  user.id,
  user.email,
  user.role,
  user.status,
  user.tokenVersion,
)

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

  const jwtToken = await signJwt(updatedUser)

  return { user: normalizeUser(updatedUser), token: jwtToken }
}

export default verifyEmail
