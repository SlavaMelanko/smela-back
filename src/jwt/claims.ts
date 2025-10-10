import type { Role, Status } from '@/types'

export interface UserClaims {
  id: number
  email: string
  role: Role
  status: Status
  tokenVersion: number
}
