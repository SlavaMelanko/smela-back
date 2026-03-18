import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { changePasswordHandler, getMeHandler, updateMeHandler } from './handler'
import { changePasswordSchema, updateProfileSchema } from './schema'

export const meRoute = new Hono<AppContext>()

meRoute.get('/me', getMeHandler)

meRoute.patch('/me', requestValidator('json', updateProfileSchema), updateMeHandler)

meRoute.patch('/me/password', requestValidator('json', changePasswordSchema), changePasswordHandler)
