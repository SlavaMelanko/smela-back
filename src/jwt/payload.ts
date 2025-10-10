import { z } from 'zod'

import { Role, Status } from '@/types'

const userPayloadSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(Status),
  v: z.number(),
  exp: z.number(),
})

export type UserPayload = z.infer<typeof userPayloadSchema>

export const parse = (payload: unknown): UserPayload => {
  return userPayloadSchema.parse(payload)
}
