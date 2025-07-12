import type { Role } from '@/types'

interface UserPayload {
  id: number
  email: string
  role: Role
  exp: number
}

interface Variables {
  user: UserPayload
}

interface AppContext {
  Variables: Variables
}

export { AppContext, UserPayload, Variables }
