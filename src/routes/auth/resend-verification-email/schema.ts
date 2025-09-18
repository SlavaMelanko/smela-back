import { buildSchema, tokenRules, userRules } from '@/lib/validation'

const resendVerificationEmailSchema = buildSchema({
  email: userRules.email,
  captchaToken: tokenRules.captchaToken,
})

export default resendVerificationEmailSchema
