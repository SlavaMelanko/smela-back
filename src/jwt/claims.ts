import type { Role, Status } from '@/types'

export interface UserClaims {
  id: number
  email: string
  role: Role
  status: Status
  tokenVersion: number
}

export const createUserClaims = (claims: UserClaims) => ({
  id: claims.id,
  email: claims.email,
  role: claims.role,
  status: claims.status,
  v: claims.tokenVersion,
})

export const createStandardClaims = (expiresIn: number) => {
  const nowInSeconds = Math.floor(Date.now() / 1000)

  return {
    exp: nowInSeconds + expiresIn,
  }
}
