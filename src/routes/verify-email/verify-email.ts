import TokenValidator from '@/lib/token-validator'
import { tokenRepo, userRepo } from '@/repositories'
import { Status, Token, TokenStatus } from '@/types'

interface VerifyEmailResult {
  status: Status
}

const markTokenAsUsed = async (tokenId: number): Promise<void> => {
  await tokenRepo.update(tokenId, {
    status: TokenStatus.Used,
    usedAt: new Date(),
  })
}

const setVerifiedStatus = async (userId: number): Promise<Status> => {
  const status = Status.Verified
  await userRepo.update(userId, { status })

  return status
}

const verifyEmail = async (token: string): Promise<VerifyEmailResult> => {
  const tokenRecord = await tokenRepo.findByToken(token)

  const validatedToken = TokenValidator.validate(tokenRecord, Token.EmailVerification)

  await markTokenAsUsed(validatedToken.id)

  const status = await setVerifiedStatus(validatedToken.userId)

  return { status }
}

export { verifyEmail as default, type VerifyEmailResult }
