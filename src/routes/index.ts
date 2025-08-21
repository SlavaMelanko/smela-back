import type { Hono } from 'hono'

import type { AppContext } from '@/types/context'

import {
  loginRoute,
  logoutRoute,
  requestPasswordResetRoute,
  resendVerificationEmailRoute,
  resetPasswordRoute,
  signupRoute,
  verifyEmailRoute,
} from './auth'
import { meRoute } from './user'

const authRoutes = [
  loginRoute,
  logoutRoute,
  signupRoute,
  verifyEmailRoute,
  resendVerificationEmailRoute,
  requestPasswordResetRoute,
  resetPasswordRoute,
]

// Routes that allow new users (status: new, verified, trial, active)
const protectedRoutesAllowNew = [meRoute]

// Routes that require verified users only (status: verified, trial, active)
const protectedRoutesVerifiedOnly: Hono<AppContext>[] = []

const publicRoutes: Hono<AppContext>[] = []

export {
  authRoutes,
  protectedRoutesAllowNew,
  protectedRoutesVerifiedOnly,
  publicRoutes,
}
