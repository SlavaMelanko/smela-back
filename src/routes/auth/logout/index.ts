import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { logoutHandler } from './handler'

export const logoutRoute = new Hono<AppContext>()

logoutRoute.post('/logout', logoutHandler)
