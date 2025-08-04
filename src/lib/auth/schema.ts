import type { z } from 'zod'

import { buildSchema } from '@/lib/validation'
import { jwtRules } from '@/lib/validation/rules'

const jwtPayloadSchema = buildSchema(jwtRules)

export type JwtPayload = z.infer<typeof jwtPayloadSchema>

export { jwtPayloadSchema }
