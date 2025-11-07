import { db, tokenRepo, userRepo } from '@/data'
import { logger } from '@/logging'
import { generateToken, TokenType } from '@/security/token'
import { emailAgent } from '@/services'
import { Status } from '@/types'

const createEmailVerificationToken = async (userId: number) => {
  const { type, token, expiresAt } = generateToken(TokenType.EmailVerification)

  await db.transaction(async (tx) => {
    await tokenRepo.replace(userId, { userId, type, token, expiresAt }, tx)
  })

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
    }).catch((error: unknown) => {
      logger.error({ error }, `Failed to send email verification email to ${user.email}`)
    })
  }

  return { data: { success: true } }
}

export default resendVerificationEmail
