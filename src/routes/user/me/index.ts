import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/lib/validation'

import { getHandler, postHandler } from './handler'
import updateProfileSchema from './schema'

const meRoute = new Hono<AppContext>()

meRoute.get('/me', getHandler)

meRoute.post('/me', requestValidator('json', updateProfileSchema), postHandler)

export default meRoute
