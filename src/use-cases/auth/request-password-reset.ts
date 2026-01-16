import type { UserPreferences } from '@/types'

import { db, tokenRepo, userRepo } from '@/data'
import { logger } from '@/logging'
import { generateToken, TokenType } from '@/security/token'
import { emailAgent } from '@/services'
import { isActive } from '@/types'

export interface RequestPasswordResetParams {
  email: string
}

const createPasswordResetToken = async (userId: number) => {
  const { type, token, expiresAt } = generateToken(TokenType.PasswordReset)

  await db.transaction(async (tx) => {
    await tokenRepo.issue(userId, { userId, type, token, expiresAt }, tx)
  })

  return token
}

const requestPasswordReset = async (
  { email }: RequestPasswordResetParams,
  preferences?: UserPreferences,
) => {
  const user = await userRepo.findByEmail(email)

  // Always return success to prevent email enumeration
  // Only send email if user exists and is active
  if (user && isActive(user.status)) {
    const token = await createPasswordResetToken(user.id)

    emailAgent.sendResetPasswordEmail(
      user.firstName,
      user.email,
      token,
      preferences,
    ).catch((error: unknown) => {
      logger.error({ error }, `Failed to send password reset email to ${user.email}`)
    })
  }

  return { data: { success: true } }
}

export default requestPasswordReset
