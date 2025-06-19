import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import loginHandler from './handler'
import loginSchema from './schema'

const loginRoute = new Hono()

loginRoute.post('/login', zValidator('json', loginSchema), loginHandler)

export default loginRoute
