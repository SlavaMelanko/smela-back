import { z } from 'zod'

import { Role, Status } from '@/types'

export const userClaimsSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: z.enum(Role),
  status: z.enum(Status),
  permissions: z.array(z.string()).optional(),
})

export type UserClaims = z.infer<typeof userClaimsSchema>

export const getUserClaims = (payload: unknown): UserClaims =>
  userClaimsSchema.parse(payload)
