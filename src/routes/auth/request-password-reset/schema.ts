import { buildStrictSchema, tokenRules, userRules } from '@/lib/validation'

const requestPasswordResetSchema = buildStrictSchema({
  email: userRules.email,
  captchaToken: tokenRules.captchaToken,
})

export default requestPasswordResetSchema
