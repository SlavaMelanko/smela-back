import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import { handler } from './handler'
import { verifyEmailSchema } from './schema'

const verifyEmailRoute = new Hono()

verifyEmailRoute.get('/verify-email', zValidator('query', verifyEmailSchema), handler)

export default verifyEmailRoute
