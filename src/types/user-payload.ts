import type Role from './role'
import type Status from './status'

export default interface UserPayload {
  id: number
  email: string
  role: Role
  status: Status
  v: number
  exp: number
}
