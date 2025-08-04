import { z } from 'zod'

import { Role, Status } from '@/types'

const rules = {
  id: z.number(),
  email: z.string().email(),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(Status),
  v: z.number(),
  exp: z.number(),
}

export default rules
