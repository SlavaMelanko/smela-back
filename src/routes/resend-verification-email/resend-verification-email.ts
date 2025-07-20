import { createTokenGenerator } from '@/lib/crypto'
import { emailAgent } from '@/lib/email-agent'
import { AppError, ErrorCode } from '@/lib/errors'
import { tokenRepo, userRepo } from '@/repositories'
import { Status, Token } from '@/types'

const resendVerificationEmail = async (email: string) => {
  const user = await userRepo.findByEmail(email)

  if (!user) {
    throw new AppError(ErrorCode.NotFound)
  }

  if (user.status !== Status.New) {
    throw new AppError(ErrorCode.AlreadyVerified)
  }

  const tokenGenerator = createTokenGenerator()
  const { token, expiresAt } = tokenGenerator.generateWithExpiry()
  const type = Token.EmailVerification

  await tokenRepo.deprecateOld(user.id, type)
  await tokenRepo.create({ userId: user.id, type, token, expiresAt })

  await emailAgent.sendWelcomeEmail({
    firstName: user.firstName,
    email: user.email,
    token,
  })

  return { success: true }
}

export default resendVerificationEmail
