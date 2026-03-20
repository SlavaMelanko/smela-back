import type { DeviceInfo } from '@/net/http/device'

import { db, tokenRepo, userRepo } from '@/data'
import { TokenStatus, TokenType } from '@/security/token'
import { Status } from '@/types'

import { createAuthTokens, validateOneTimeToken } from '../tokens'

export interface VerifyEmailInput {
  token: string
}

export const verifyEmail = async ({ token }: VerifyEmailInput, deviceInfo: DeviceInfo) => {
  const validatedToken = await validateOneTimeToken(token, TokenType.EmailVerification)

  const updatedUser = await db.transaction(async (tx) => {
    // Mark token as used
    await tokenRepo.update(validatedToken.id, {
      status: TokenStatus.Used,
      usedAt: new Date(),
    }, tx)

    // Update user status
    return userRepo.update(validatedToken.userId, { status: Status.Verified }, tx)
  })

  const [accessToken, refreshToken] = await createAuthTokens(updatedUser, deviceInfo)

  return {
    data: { user: updatedUser, accessToken },
    refreshToken,
  }
}
