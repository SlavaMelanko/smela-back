import { buildSchema, userRules } from '@/lib/validation'

const resendVerificationEmailSchema = buildSchema({
  email: userRules.email.req,
})

export default resendVerificationEmailSchema
