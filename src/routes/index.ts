import type { Hono } from 'hono'

import type { AppContext } from '@/context'

import {
  loginRoute,
  logoutRoute,
  refreshTokenRoute,
  requestPasswordResetRoute,
  resendVerificationEmailRoute,
  resetPasswordRoute,
  signupRoute,
  verifyEmailRoute,
} from './auth'
import { meRoute } from './user'

export const authPublicRoutes: Hono<AppContext>[] = [
  loginRoute,
  logoutRoute,
  refreshTokenRoute,
  signupRoute,
  verifyEmailRoute,
  resendVerificationEmailRoute,
  requestPasswordResetRoute,
  resetPasswordRoute,
]

export const userRoutesAllowNew: Hono<AppContext>[] = [meRoute]

export const userRoutesVerifiedOnly: Hono<AppContext>[] = []

export const adminRoutes: Hono<AppContext>[] = []
