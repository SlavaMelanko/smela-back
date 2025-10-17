import { db, tokenRepo, userRepo } from '@/data'
import { logger } from '@/logging'
import { generateToken, TokenType } from '@/security/token'
import { emailAgent } from '@/services'
import { isActive } from '@/types'

const createPasswordResetToken = async (userId: number) => {
  const { type, token, expiresAt } = generateToken(TokenType.PasswordReset)

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
    }).catch((error: unknown) => {
      logger.error({ error }, `Failed to send password reset email to ${user.email}`)
    })
  }

  return { success: true }
}

export default requestPasswordReset
