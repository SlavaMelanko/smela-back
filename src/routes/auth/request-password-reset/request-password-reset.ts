import { db, tokenRepo, userRepo } from '@/data'
import { emailAgent } from '@/lib/email-agent'
import logger from '@/lib/logger'
import { generateToken } from '@/lib/token'
import { isActive, Token } from '@/types'

const createPasswordResetToken = async (userId: number) => {
  const { type, token, expiresAt } = generateToken(Token.PasswordReset)

  await db.transaction(async (tx) => {
    await tokenRepo.replace(userId, { userId, type, token, expiresAt }, tx)
  })

  return token
}

const requestPasswordReset = async (email: string) => {
  const user = await userRepo.findByEmail(email)

  // Always return success to prevent email enumeration
  // Only send email if user exists and is active
  if (user && isActive(user.status)) {
    const token = await createPasswordResetToken(user.id)

    emailAgent.sendResetPasswordEmail({
      firstName: user.firstName,
      email: user.email,
      token,
    }).catch((error) => {
      logger.error({ error }, `Failed to send password reset email to ${user.email}`)
    })
  }

  return { success: true }
}

export default requestPasswordReset
