import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import signupHandler from './handler'
import signupSchema from './schema'

const signupRoute = new Hono()

signupRoute.post('/signup', zValidator('json', signupSchema), signupHandler)

export default signupRoute
