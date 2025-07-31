import { Hono } from 'hono'

import { requestValidator } from '@/lib/validation'

import handler from './handler'
import schema from './schema'

const requestPasswordResetRoute = new Hono()

requestPasswordResetRoute.post('/request-password-reset', requestValidator('json', schema), handler)

export default requestPasswordResetRoute
