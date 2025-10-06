import { buildStrictSchema, tokenRules, userRules } from '@/lib/validation'

const resendVerificationEmailSchema = buildStrictSchema({
  email: userRules.email,
  captchaToken: tokenRules.captchaToken,
})

export default resendVerificationEmailSchema
