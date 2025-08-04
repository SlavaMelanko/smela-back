import type { Role, Status } from '@/types'

interface UserPayload {
  id: number
  email: string
  role: Role
  status: Status
  v: number
  exp: number
}

interface Variables {
  user: UserPayload
}

interface AppContext {
  Variables: Variables
}

export { AppContext, UserPayload, Variables }
