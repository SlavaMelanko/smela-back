import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { requestValidator } from '@/middleware'

import { verifyEmailHandler } from './handler'
import { verifyEmailBodySchema } from './schema'

export const verifyEmailRoute = new Hono<AppContext>()

verifyEmailRoute.post(
  '/verify-email',
  requestValidator('json', verifyEmailBodySchema),
  verifyEmailHandler,
)
