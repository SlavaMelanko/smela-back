import { Hono } from 'hono'

import { requestValidator } from '@/lib/validation'

import handler from './handler'
import schema from './schema'

const verifyEmailRoute = new Hono()

verifyEmailRoute.get('/verify-email', requestValidator('query', schema), handler)

export default verifyEmailRoute
