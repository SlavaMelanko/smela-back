import { refreshTokenRepo } from '@/data'
import { hashToken } from '@/security/token'
import { getErrorTracker } from '@/services/error-tracker'

const revokeRefreshToken = async (refreshToken: string | undefined) => {
  if (!refreshToken) {
    return
  }

  const tokenHash = await hashToken(refreshToken)

  await refreshTokenRepo.revokeByHash(tokenHash)
}

export const logout = async (refreshToken: string | undefined) => {
  await revokeRefreshToken(refreshToken)

  getErrorTracker().clearUser()
}
