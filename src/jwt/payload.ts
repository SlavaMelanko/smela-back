import { z } from 'zod'

import { Role, Status } from '@/types'

const payloadSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(Status),
  v: z.number(),
  exp: z.number(),
})

export type Payload = z.infer<typeof payloadSchema>

export const parse = (payload: unknown): Payload => {
  return payloadSchema.parse(payload)
}
