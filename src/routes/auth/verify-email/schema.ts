import { buildStrictSchema, tokenRules } from '@/lib/validation'

const verifyEmailSchema = buildStrictSchema({
  token: tokenRules.token,
})

export default verifyEmailSchema
