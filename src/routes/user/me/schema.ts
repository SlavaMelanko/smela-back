import { z } from 'zod'

import { requestValidationRules as rules } from '../../@shared'

const updateProfileSchema = z.object({
  firstName: rules.data.optionalName,
  lastName: rules.data.optionalName,
})

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>

export default updateProfileSchema
