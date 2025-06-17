import { buildSchema, userRules } from '@/lib/validation'

const signupSchema = buildSchema({
  firstName: userRules.name,
  lastName: userRules.name,
  email: userRules.email,
  password: userRules.password,
})

export default signupSchema
