import { buildSchema, userRules } from '@/lib/validation'

const resendVerificationEmailSchema = buildSchema({
  email: userRules.email,
})

export default resendVerificationEmailSchema
