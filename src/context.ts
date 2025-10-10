import type { UserPayload } from '@/jwt'

export interface Variables {
  user: UserPayload
}

export interface AppContext {
  Variables: Variables
}
