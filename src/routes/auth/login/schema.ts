import { buildSchema, tokenRules, userRules } from '@/lib/validation'

const loginSchema = buildSchema({
  email: userRules.email,
  password: userRules.password,
  captchaToken: tokenRules.captchaToken,
})

export default loginSchema
