import type { PinoLogger } from 'hono-pino'

interface UserPayload {
  email: string
  role: 'user' | 'admin'
  exp: number
}

interface Variables {
  user: UserPayload
  logger: PinoLogger
}

interface AppContext {
  Variables: Variables
}

export { AppContext, UserPayload, Variables }
