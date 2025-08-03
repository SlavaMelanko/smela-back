import { Hono } from 'hono'

import { requestValidator } from '@/lib/validation'

import handler from './handler'
import schema from './schema'

const verifyEmailRoute = new Hono()

verifyEmailRoute.post('/verify-email', requestValidator('json', schema), handler)

export default verifyEmailRoute
