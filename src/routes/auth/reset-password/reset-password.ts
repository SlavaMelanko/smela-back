import { createPasswordEncoder } from '@/lib/crypto'
import { TokenValidator } from '@/lib/token'
import { authRepo, tokenRepo, userRepo } from '@/repositories'
import { Token, TokenStatus } from '@/types'

interface ResetPasswordParams {
  token: string
  password: string
}

const markTokenAsUsed = async (tokenId: number): Promise<void> => {
  await tokenRepo.update(tokenId, {
    status: TokenStatus.Used,
    usedAt: new Date(),
  })
}

const updatePassword = async (userId: number, newPassword: string): Promise<void> => {
  const encoder = createPasswordEncoder()
  const passwordHash = await encoder.hash(newPassword)

  await authRepo.update(userId, { passwordHash })
}

const resetPassword = async ({ token, password }: ResetPasswordParams): Promise<{ success: boolean }> => {
  const tokenRecord = await tokenRepo.findByToken(token)

  const validatedToken = TokenValidator.validate(tokenRecord, Token.PasswordReset)

  await markTokenAsUsed(validatedToken.id)

  await updatePassword(validatedToken.userId, password)

  await userRepo.incrementTokenVersion(validatedToken.userId)

  return { success: true }
}

export default resetPassword
