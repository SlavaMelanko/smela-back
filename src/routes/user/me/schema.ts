import { z } from 'zod'

import { requestValidationRules as rules } from '../../@shared'

const updateProfileSchema = z.object({
  data: z.object({
    firstName: rules.data.firstName.optional(),
    lastName: rules.data.lastName.optional(),
  }).strict(),
}).strict()

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>

export default updateProfileSchema
