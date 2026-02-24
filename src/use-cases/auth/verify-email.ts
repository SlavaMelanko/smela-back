import type { DeviceInfo } from '@/net/http/device'

import { db, tokenRepo, userRepo } from '@/data'
import { TokenStatus, TokenType } from '@/security/token'
import { Status } from '@/types'

import { createAccessToken, createRefreshToken, validateStringToken } from '../tokens'

export interface VerifyEmailParams {
  token: string
}

const verifyEmail = async ({ token }: VerifyEmailParams, deviceInfo: DeviceInfo) => {
  const validatedToken = await validateStringToken(token, TokenType.EmailVerification)

  const updatedUser = await db.transaction(async (tx) => {
    // Mark token as used
    await tokenRepo.update(validatedToken.id, {
      status: TokenStatus.Used,
      usedAt: new Date(),
    }, tx)

    // Update user status
    return userRepo.update(validatedToken.userId, { status: Status.Verified }, tx)
  })

  const accessToken = await createAccessToken(updatedUser)
  const refreshToken = await createRefreshToken(updatedUser.id, deviceInfo)

  return {
    data: { user: updatedUser, accessToken },
    refreshToken,
  }
}

export default verifyEmail
