import { buildSchema, userRules } from '@/lib/validation'

const updateProfileSchema = buildSchema({
  firstName: userRules.name.nullable().optional(),
  lastName: userRules.name.nullable().optional(),
})

export default updateProfileSchema
