import { refreshTokenRepo } from '@/data'
import { hashToken } from '@/security/token'

const logOut = async (refreshToken: string): Promise<void> => {
  const hashedToken = await hashToken(refreshToken)
  const tokenRecord = await refreshTokenRepo.findByTokenHash(hashedToken)

  if (tokenRecord) {
    await refreshTokenRepo.revokeById(tokenRecord.id)
  }
}

export default logOut
