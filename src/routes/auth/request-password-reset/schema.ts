import { buildSchema, userRules } from '@/lib/validation'

const requestPasswordResetSchema = buildSchema({
  email: userRules.email.req,
})

export default requestPasswordResetSchema
