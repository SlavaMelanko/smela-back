import type { Hono } from 'hono'

import type { AppContext } from '@/context'

import { adminTeamsRoute, adminUsersRoute } from './admin'
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
import { meRoute, teamsRoute } from './user'

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

export const userRoutesVerifiedOnly: Hono<AppContext>[] = [teamsRoute]

export const adminRoutes: Hono<AppContext>[] = [adminTeamsRoute, adminUsersRoute]

export const ownerRoutes: Hono<AppContext>[] = [ownerAdminsRoute]
