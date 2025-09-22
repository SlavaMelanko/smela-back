import type { UserPayload } from '@/types'

import { buildSchema, jwtRules } from '@/lib/validation'

export const parsePayload = (payload: unknown): UserPayload => {
  return buildSchema(jwtRules).parse(payload)
}
