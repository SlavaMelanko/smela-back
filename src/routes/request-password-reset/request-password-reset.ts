import type { Status } from '@/types'

import { emailAgent } from '@/lib/email-agent'
import { AppError, ErrorCode } from '@/lib/errors'
import { generateToken, PASSWORD_RESET_EXPIRY_HOURS } from '@/lib/token'
import { tokenRepo, userRepo } from '@/repositories'
import { isActive, Token } from '@/types'

const createPasswordResetToken = async (userId: number) => {
  const { type, token, expiresAt } = generateToken(Token.PasswordReset, { expiryHours: PASSWORD_RESET_EXPIRY_HOURS })

  await tokenRepo.deprecateOld(userId, type)
  await tokenRepo.create({ userId, type, token, expiresAt })

  return token
}

const requestPasswordReset = async (email: string) => {
  const user = await userRepo.findByEmail(email)

  if (!user) {
    throw new AppError(ErrorCode.UserNotFound)
  }

  if (!isActive(user.status as Status)) {
    throw new AppError(ErrorCode.Forbidden)
  }

  const token = await createPasswordResetToken(user.id)

  await emailAgent.sendResetPasswordEmail({
    firstName: user.firstName,
    email: user.email,
    token,
  })

  return { success: true }
}

export default requestPasswordReset
