import type { InferType } from '@/lib/validation'

import { buildSchema, userRules } from '@/lib/validation'

const updateProfileSchema = buildSchema({
  firstName: userRules.name.opt,
  lastName: userRules.name.opt,
})

export type UpdateProfileBody = InferType<typeof updateProfileSchema>

export default updateProfileSchema
