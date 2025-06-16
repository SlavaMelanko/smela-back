interface UserPayload {
  email: string
  role: 'user' | 'admin'
  exp: number
}

interface Variables {
  user: UserPayload
}

export { UserPayload, Variables }
