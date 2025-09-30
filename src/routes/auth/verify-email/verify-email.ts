import type { User } from '@/repositories/user/types'

import jwt from '@/lib/jwt'
import { TokenValidator } from '@/lib/token'
import { normalizeUser } from '@/lib/user'
import { tokenRepo, userRepo } from '@/repositories'
import { Status, Token, TokenStatus } from '@/types'

export interface VerifyEmailResult {
  user: ReturnType<typeof normalizeUser>
  token: string
}

const markTokenAsUsed = async (tokenId: number): Promise<void> => {
  await tokenRepo.update(tokenId, {
    status: TokenStatus.Used,
    usedAt: new Date(),
  })
}

const setVerifiedStatus = async (userId: number): Promise<User> => {
  const updatedUser = await userRepo.update(userId, { status: Status.Verified })

  return updatedUser
}

const signJwt = async (user: User) => jwt.sign(
  user.id,
  user.email,
  user.role,
  user.status,
  user.tokenVersion,
)

const verifyEmail = async (token: string): Promise<VerifyEmailResult> => {
  const tokenRecord = await tokenRepo.findByToken(token)

  const validatedToken = TokenValidator.validate(tokenRecord, Token.EmailVerification)

  await markTokenAsUsed(validatedToken.id)

  const updatedUser = await setVerifiedStatus(validatedToken.userId)

  const jwtToken = await signJwt(updatedUser)

  return { user: normalizeUser(updatedUser), token: jwtToken }
}

export default verifyEmail
