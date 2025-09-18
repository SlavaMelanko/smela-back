import { buildSchema, tokenRules, userRules } from '@/lib/validation'

const requestPasswordResetSchema = buildSchema({
  email: userRules.email,
  captchaToken: tokenRules.captchaToken,
})

export default requestPasswordResetSchema
