import type { UserClaims } from '@/security/jwt'

export interface Variables {
  user: UserClaims
}

export interface AppContext {
  Variables: Variables
}
