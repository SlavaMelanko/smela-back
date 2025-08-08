import { buildSchema, tokenRules } from '@/lib/validation'

const verifyEmailSchema = buildSchema({
  token: tokenRules.token,
})

export default verifyEmailSchema
