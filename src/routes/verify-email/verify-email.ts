import TokenValidator from '@/lib/token-validator'
import { secureTokenRepo, userRepo } from '@/repositories'
import { SecureToken, Status } from '@/types'

interface VerifyEmailResult {
  status: Status
}

const markTokenAsUsed = async (tokenId: number): Promise<void> => {
  await secureTokenRepo.update(tokenId, { usedAt: new Date() })
}

const setVerifiedStatus = async (userId: number): Promise<Status> => {
  const status = Status.Verified
  await userRepo.update(userId, { status })

  return status
}

const verifyEmail = async (token: string): Promise<VerifyEmailResult> => {
  const tokenRecord = await secureTokenRepo.findByToken(token)

  const validatedToken = TokenValidator.validate(tokenRecord, SecureToken.EmailVerification)

  await markTokenAsUsed(validatedToken.id)

  const status = await setVerifiedStatus(validatedToken.userId)

  return { status }
}

export { verifyEmail as default, type VerifyEmailResult }
