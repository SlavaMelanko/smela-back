import { buildStrictSchema, tokenRules, userRules } from '@/lib/validation'

const signupSchema = buildStrictSchema({
  firstName: userRules.name,
  lastName: userRules.name.opt,
  email: userRules.email,
  password: userRules.password,
  captchaToken: tokenRules.captchaToken,
})

export default signupSchema
