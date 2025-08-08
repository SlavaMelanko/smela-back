import { buildSchema, userRules } from '@/lib/validation'

const updateProfileSchema = buildSchema({
  firstName: userRules.name,
  lastName: userRules.name,
})

export default updateProfileSchema
