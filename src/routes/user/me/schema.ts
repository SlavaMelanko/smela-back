import { z } from 'zod'

import { dataValidationRules as rules } from '../../@shared'

const updateProfileSchema = z.object({
  firstName: rules.optionalName,
  lastName: rules.optionalName,
})

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>

export default updateProfileSchema
