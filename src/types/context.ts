type UserPayload = {
  email: string
  role: 'user' | 'admin'
  exp: number
}

type Variables = {
  user: UserPayload
}

export { UserPayload, Variables }
