import { z } from 'zod'

import { dataValidationRules as rules } from '../../@shared'

const updateProfileSchema = z.object({
  firstName: rules.name.nullish(),
  lastName: rules.name.nullish(),
})

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>

export default updateProfileSchema
