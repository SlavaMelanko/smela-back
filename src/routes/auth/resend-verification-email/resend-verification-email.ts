import { emailAgent } from '@/lib/email-agent'
import logger from '@/lib/logger'
import { generateToken } from '@/lib/token'
import { tokenRepo, userRepo } from '@/repositories'
import { Status, Token } from '@/types'

const createEmailVerificationToken = async (userId: number) => {
  const { type, token, expiresAt } = generateToken(Token.EmailVerification)

  await tokenRepo.deprecateOld(userId, type)
  await tokenRepo.create({ userId, type, token, expiresAt })

  return token
}

const resendVerificationEmail = async (email: string) => {
  const user = await userRepo.findByEmail(email)

  // Always return success to prevent email enumeration
  // Only send email if user exists and is unverified
  if (user && user.status === Status.New) {
    const token = await createEmailVerificationToken(user.id)

    emailAgent.sendWelcomeEmail({
      firstName: user.firstName,
      email: user.email,
      token,
    }).catch((error) => {
      logger.error({ error }, `Failed to send email verification email to ${user.email}`)
    })
  }

  return { success: true }
}

export default resendVerificationEmail
