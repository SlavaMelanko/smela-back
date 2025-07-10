import HttpError from '@/lib/http-error'
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

  if (!tokenRecord) {
    throw new HttpError(400, 'Token not found')
  }

  if (tokenRecord.usedAt) {
    throw new HttpError(400, 'Token has already been used')
  }

  if (tokenRecord.type !== SecureToken.EmailVerification) {
    throw new HttpError(400, 'Token is not a valid email verification token')
  }

  if (tokenRecord.expiresAt < new Date()) {
    throw new HttpError(400, 'Token has expired')
  }

  await markTokenAsUsed(tokenRecord.id)

  const status = await setVerifiedStatus(tokenRecord.userId)

  return { status }
}

export { verifyEmail as default, type VerifyEmailResult }
