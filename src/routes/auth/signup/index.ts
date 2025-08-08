import { Hono } from 'hono'

import { requestValidator } from '@/lib/validation'

import handler from './handler'
import schema from './schema'

const signupRoute = new Hono()

signupRoute.post('/signup', requestValidator('json', schema), handler)

export default signupRoute
