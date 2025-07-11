import { Hono } from 'hono'

import { requestValidator } from '@/lib/validation'

import signupHandler from './handler'
import signupSchema from './schema'

const signupRoute = new Hono()

signupRoute.post('/signup', requestValidator('json', signupSchema), signupHandler)

export default signupRoute
