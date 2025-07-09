import HttpError from '@/lib/http-error'
import { secureTokenRepo, userRepo } from '@/repositories'
import { SecureToken, Status } from '@/types'

interface VerifyEmailResult {
  status: Status
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

  // Mark token as used
  await secureTokenRepo.markAsUsed(tokenRecord.id)

  const status = Status.Verified

  // Update user status to verified
  await userRepo.update(tokenRecord.userId, { status })

  return { status }
}

export { verifyEmail }
export type { VerifyEmailResult }
