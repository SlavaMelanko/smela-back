import { Hono } from 'hono'

import { requestValidator } from '@/lib/validation'

import resendVerificationEmailHandler from './handler'
import resendVerificationEmailSchema from './schema'

const resendVerificationEmailRoute = new Hono()

resendVerificationEmailRoute.post(
  '/resend-verification-email',
  requestValidator('json', resendVerificationEmailSchema),
  resendVerificationEmailHandler,
)

export default resendVerificationEmailRoute
