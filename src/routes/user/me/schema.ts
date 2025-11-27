import { z } from 'zod'

import { requestValidationRules as rules } from '../../@shared'

const updateProfileSchema = z.object({
  data: z.object({
    firstName: rules.data.optionalName,
    lastName: rules.data.optionalName,
  }).strict(),
}).strict()

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>

export default updateProfileSchema
