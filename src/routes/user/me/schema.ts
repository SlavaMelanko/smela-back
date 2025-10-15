import { z } from 'zod'

import { userRules } from '@/lib/validation'

const updateProfileSchema = z.object({
  firstName: userRules.name.nullish(),
  lastName: userRules.name.nullish(),
})

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>

export default updateProfileSchema
