import { Hono } from 'hono'

import { requestValidator } from '@/lib/validation'

import verifyEmailHandler from './handler'
import verifyEmailSchema from './schema'

const verifyEmailRoute = new Hono()

verifyEmailRoute.get('/verify-email', requestValidator('query', verifyEmailSchema), verifyEmailHandler)

export default verifyEmailRoute
