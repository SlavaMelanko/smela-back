import type { UserClaims } from '@/jwt'

export interface Variables {
  user: UserClaims
}

export interface AppContext {
  Variables: Variables
}
