import { buildSchema, tokenRules, userRules } from '@/lib/validation'

const resetPasswordSchema = buildSchema({
  token: tokenRules.token,
  password: userRules.password.req,
})

export default resetPasswordSchema
