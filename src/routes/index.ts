import type { Hono } from 'hono'

import type { AppContext } from '@/context'

import { adminCompaniesRoute, adminUsersRoute } from './admin'
import {
  acceptInviteRoute,
  loginRoute,
  logoutRoute,
  refreshTokenRoute,
  requestPasswordResetRoute,
  resendVerificationEmailRoute,
  resetPasswordRoute,
  signupRoute,
  verifyEmailRoute,
} from './auth'
import { ownerAdminsRoute } from './owner'
import { meRoute } from './user'

export const authPublicRoutes: Hono<AppContext>[] = [
  acceptInviteRoute,
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

export const adminRoutes: Hono<AppContext>[] = [adminCompaniesRoute, adminUsersRoute]

export const ownerRoutes: Hono<AppContext>[] = [ownerAdminsRoute]
