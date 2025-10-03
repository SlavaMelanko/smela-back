import { authRepo, db, tokenRepo, userRepo } from '@/data'
import { hashPassword } from '@/lib/cipher'
import { TokenValidator } from '@/lib/token'
import { Token, TokenStatus } from '@/types'

interface ResetPasswordParams {
  token: string
  password: string
}

const validateToken = async (token: string) => {
  const tokenRecord = await tokenRepo.findByToken(token)

  return TokenValidator.validate(tokenRecord, Token.PasswordReset)
}

const resetPassword = async ({ token, password }: ResetPasswordParams): Promise<{ success: boolean }> => {
  const validatedToken = await validateToken(token)

  await db.transaction(async (tx) => {
    // Mark token as used
    await tokenRepo.update(validatedToken.id, {
      status: TokenStatus.Used,
      usedAt: new Date(),
    }, tx)

    // Update user's password
    const passwordHash = await hashPassword(password)
    await authRepo.update(validatedToken.userId, { passwordHash }, tx)

    // Invalidate all existing sessions by incrementing token version
    await userRepo.incrementTokenVersion(validatedToken.userId, tx)
  })

  return { success: true }
}

export default resetPassword
