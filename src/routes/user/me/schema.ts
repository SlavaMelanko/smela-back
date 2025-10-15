import type { InferType } from '@/lib/validation'

import { buildSchema, userRules } from '@/lib/validation'

const updateProfileSchema = buildSchema({
  firstName: userRules.name.nullish(),
  lastName: userRules.name.nullish(),
})

export type UpdateProfileBody = InferType<typeof updateProfileSchema>

export default updateProfileSchema
