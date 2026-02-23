import type { DeviceInfo } from '@/net/http/device'

import { db, tokenRepo, userRepo } from '@/data'
import { TokenStatus, TokenType, TokenValidator } from '@/security/token'
import { Status } from '@/types'

import { createAccessToken, createRefreshToken } from '../create-tokens'

export interface VerifyEmailParams {
  token: string
}

const validateToken = async (token: string) => {
  const tokenRecord = await tokenRepo.findByToken(token)

  return TokenValidator.validate(tokenRecord, TokenType.EmailVerification)
}

const verifyEmail = async ({ token }: VerifyEmailParams, deviceInfo: DeviceInfo) => {
  const validatedToken = await validateToken(token)

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
