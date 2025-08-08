import { Hono } from 'hono'

import { requestValidator } from '@/lib/validation'

import handler from './handler'
import schema from './schema'

const resendVerificationEmailRoute = new Hono()

resendVerificationEmailRoute.post('/resend-verification-email', requestValidator('json', schema), handler)

export default resendVerificationEmailRoute
