import { buildSchema, tokenRules, userRules } from '@/lib/validation'

const resetPasswordSchema = buildSchema({
  token: tokenRules.token,
  password: userRules.password,
  captchaToken: tokenRules.captchaToken,
})

export default resetPasswordSchema
