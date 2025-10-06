import { buildStrictSchema, tokenRules, userRules } from '@/lib/validation'

const resetPasswordSchema = buildStrictSchema({
  token: tokenRules.token,
  password: userRules.password,
})

export default resetPasswordSchema
