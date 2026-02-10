import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { getMeHandler, updateMeHandler } from './handler'
import updateProfileSchema from './schema'

const meRoute = new Hono<AppContext>()

// /me
meRoute.get('/me', getMeHandler)

meRoute.patch('/me', requestValidator('json', updateProfileSchema), updateMeHandler)

export default meRoute
