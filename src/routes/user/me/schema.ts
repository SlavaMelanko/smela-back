import { buildSchema, userRules } from '@/lib/validation'

const updateProfileSchema = buildSchema({
  firstName: userRules.name.opt,
  lastName: userRules.name.opt,
})

export default updateProfileSchema
