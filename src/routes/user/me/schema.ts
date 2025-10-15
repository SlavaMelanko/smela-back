import { z } from 'zod'

import { rules } from '@/lib/rules'

const updateProfileSchema = z.object({
  firstName: rules.name.nullish(),
  lastName: rules.name.nullish(),
})

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>

export default updateProfileSchema
