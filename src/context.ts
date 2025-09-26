import type { UserPayload } from '@/types'

export interface Variables {
  user: UserPayload
}

export interface AppContext {
  Variables: Variables
}
