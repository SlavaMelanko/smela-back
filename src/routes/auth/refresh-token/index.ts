import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { refreshTokenHandler } from './handler'

export const refreshTokenRoute = new Hono<AppContext>()

refreshTokenRoute.post('/refresh-token', refreshTokenHandler)
