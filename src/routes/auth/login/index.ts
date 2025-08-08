import { Hono } from 'hono'

import { requestValidator } from '@/lib/validation'

import handler from './handler'
import schema from './schema'

const loginRoute = new Hono()

loginRoute.post('/login', requestValidator('json', schema), handler)

export default loginRoute
