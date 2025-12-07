import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import adminUsersHandler from './handler'
import schema from './schema'

const adminUsersRoute = new Hono<AppContext>()

adminUsersRoute.get('/users', requestValidator('query', schema), adminUsersHandler)

export default adminUsersRoute
