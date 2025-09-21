import type { Role, Status } from '@/types'

export interface UserPayload {
  id: number
  email: string
  role: Role
  status: Status
  v: number
  exp: number
}

export interface Variables {
  user: UserPayload
}

export interface AppContext {
  Variables: Variables
}
