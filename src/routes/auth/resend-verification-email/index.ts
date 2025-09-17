import { Hono } from 'hono'

import { requestValidator } from '@/lib/validation'
import { captchaMiddleware } from '@/middleware'

import handler from './handler'
import schema from './schema'

const resendVerificationEmailRoute = new Hono()

resendVerificationEmailRoute.post('/resend-verification-email', requestValidator('json', schema), captchaMiddleware(), handler)

export default resendVerificationEmailRoute
