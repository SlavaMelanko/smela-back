import { Hono } from 'hono'

import { requestValidator } from '@/lib/validation'

import loginHandler from './handler'
import loginSchema from './schema'

const loginRoute = new Hono()

loginRoute.post('/login', requestValidator('json', loginSchema), loginHandler)

export default loginRoute
