import { buildSchema, userRules } from '@/lib/validation'

const signupSchema = buildSchema({
  firstName: userRules.name.req,
  lastName: userRules.name.req,
  email: userRules.email.req,
  password: userRules.password.req,
})

export default signupSchema
