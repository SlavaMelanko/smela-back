import { buildSchema, userRules } from '@/lib/validation'

const loginSchema = buildSchema({
  email: userRules.email,
  password: userRules.password,
})

export default loginSchema
