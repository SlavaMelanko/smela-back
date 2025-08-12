import type { User } from '@/repositories/user/types'

import { jwt } from '@/lib/auth'
import { AppError, ErrorCode } from '@/lib/catch'
import { TokenValidator } from '@/lib/token'
import { normalizeUser } from '@/lib/user'
import { tokenRepo, userRepo } from '@/repositories'
import { Status, Token, TokenStatus } from '@/types'

interface VerifyEmailResult {
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

  if (!updatedUser) {
    throw new AppError(ErrorCode.InternalError)
  }

  return updatedUser
}

const verifyEmail = async (token: string): Promise<VerifyEmailResult> => {
  const tokenRecord = await tokenRepo.findByToken(token)

  const validatedToken = TokenValidator.validate(tokenRecord, Token.EmailVerification)

  await markTokenAsUsed(validatedToken.id)

  const updatedUser = await setVerifiedStatus(validatedToken.userId)

  // Generate JWT token for immediate authentication.
  const jwtToken = await jwt.sign(
    updatedUser.id,
    updatedUser.email,
    updatedUser.role,
    updatedUser.status,
    updatedUser.tokenVersion,
  )

  return { user: normalizeUser(updatedUser), token: jwtToken }
}

export { verifyEmail as default, type VerifyEmailResult }
