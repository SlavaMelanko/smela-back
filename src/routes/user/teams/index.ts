import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { teamByIdRoute } from './$id'

export const teamsRoute = new Hono<AppContext>()

teamsRoute.route('/teams/:teamId', teamByIdRoute)
