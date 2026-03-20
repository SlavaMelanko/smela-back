import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { resetPasswordHandler } from './handler'
import { resetPasswordBodySchema } from './schema'

export const resetPasswordRoute = new Hono<AppContext>()

resetPasswordRoute.post(
  '/reset-password',
  requestValidator('json', resetPasswordBodySchema),
  resetPasswordHandler,
)
