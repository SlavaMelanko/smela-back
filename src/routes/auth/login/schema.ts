import { buildStrictSchema, tokenRules, userRules } from '@/lib/validation'

const loginSchema = buildStrictSchema({
  email: userRules.email,
  password: userRules.password,
  captchaToken: tokenRules.captchaToken,
})

export default loginSchema
