import { emailAgent } from '@/lib/email-agent'
import { AppError, ErrorCode } from '@/lib/errors'
import { EMAIL_VERIFICATION_EXPIRY_HOURS, generateToken } from '@/lib/token'
import { tokenRepo, userRepo } from '@/repositories'
import { Status, Token } from '@/types'

const createEmailVerificationToken = async (userId: number) => {
  const { type, token, expiresAt } = generateToken(Token.EmailVerification, { expiryHours: EMAIL_VERIFICATION_EXPIRY_HOURS })

  await tokenRepo.deprecateOld(userId, type)
  await tokenRepo.create({ userId, type, token, expiresAt })

  return token
}

const resendVerificationEmail = async (email: string) => {
  const user = await userRepo.findByEmail(email)

  if (!user) {
    throw new AppError(ErrorCode.UserNotFound)
  }

  if (user.status !== Status.New) {
    throw new AppError(ErrorCode.AlreadyVerified)
  }

  const token = await createEmailVerificationToken(user.id)

  await emailAgent.sendWelcomeEmail({
    firstName: user.firstName,
    email: user.email,
    token,
  })

  return { success: true }
}

export default resendVerificationEmail
