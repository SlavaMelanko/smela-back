import { z } from 'zod'

import { Role, Status } from '@/types'

export const userClaimsSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(Status),
  tokenVersion: z.number(),
})

export type UserClaims = z.infer<typeof userClaimsSchema>

export const getUserClaims = (payload: unknown): UserClaims =>
  userClaimsSchema.parse(payload)
