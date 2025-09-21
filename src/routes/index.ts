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

export const authRoutes = [
  loginRoute,
  logoutRoute,
  signupRoute,
  verifyEmailRoute,
  resendVerificationEmailRoute,
  requestPasswordResetRoute,
  resetPasswordRoute,
]

// Routes that allow new users (status: new, verified, trial, active)
export const protectedRoutesAllowNew = [meRoute]

// Routes that require verified users only (status: verified, trial, active)
export const protectedRoutesVerifiedOnly: Hono<AppContext>[] = []

export const publicRoutes: Hono<AppContext>[] = []
