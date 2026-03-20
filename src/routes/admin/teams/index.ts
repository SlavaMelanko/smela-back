import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { createTeamHandler, getTeamsHandler } from './handler'
import { createTeamBodySchema, getTeamsQuerySchema } from './schema'

export const adminTeamsRoute = new Hono<AppContext>()

adminTeamsRoute.get(
  '/teams',
  requestValidator('query', getTeamsQuerySchema),
  getTeamsHandler,
)

adminTeamsRoute.post(
  '/teams',
  requestValidator('json', createTeamBodySchema),
  createTeamHandler,
)
