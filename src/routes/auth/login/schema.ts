import { buildSchema, userRules } from '@/lib/validation'

const loginSchema = buildSchema({
  email: userRules.email.req,
  password: userRules.password.req,
})

export default loginSchema
