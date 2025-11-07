import type { User } from '@/data'

import { db, tokenRepo, userRepo } from '@/data'
import { signJwt } from '@/security/jwt'
import { TokenStatus, TokenType, TokenValidator } from '@/security/token'
import { Status } from '@/types'

const validateToken = async (token: string) => {
  const tokenRecord = await tokenRepo.findByToken(token)

  return TokenValidator.validate(tokenRecord, TokenType.EmailVerification)
}

const createJwtToken = async (user: User) => signJwt(
  {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  },
)

const verifyEmail = async (token: string) => {
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

  const jwtToken = await createJwtToken(updatedUser)

  return {
    data: { user: updatedUser },
    accessToken: jwtToken,
  }
}

export default verifyEmail
