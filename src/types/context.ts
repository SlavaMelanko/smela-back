interface UserPayload {
  id: number
  email: string
  role: 'user' | 'admin'
  exp: number
}

interface Variables {
  user: UserPayload
}

interface AppContext {
  Variables: Variables
}

export { AppContext, UserPayload, Variables }
