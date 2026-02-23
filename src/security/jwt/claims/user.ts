import { z } from 'zod'

import { Permission, Role, Status } from '@/types'

export const userClaimsSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(Status),
  permissions: z.array(z.nativeEnum(Permission)),
})

export type UserClaims = z.infer<typeof userClaimsSchema>

export const getUserClaims = (payload: unknown): UserClaims =>
  userClaimsSchema.parse(payload)
