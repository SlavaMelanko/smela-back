import { Hono } from 'hono'

import { requestValidator } from '@/lib/validation'
import { captchaMiddleware } from '@/middleware'

import handler from './handler'
import schema from './schema'

const resetPasswordRoute = new Hono()

resetPasswordRoute.post('/reset-password', requestValidator('json', schema), captchaMiddleware(), handler)

export default resetPasswordRoute
