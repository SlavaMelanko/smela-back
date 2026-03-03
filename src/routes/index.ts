import { adminTeamsRoute, adminUsersRoute } from './admin'
import {
  acceptInviteRoute,
  checkInviteRoute,
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

export const authPublicRoutes = [
  acceptInviteRoute,
  checkInviteRoute,
  loginRoute,
  logoutRoute,
  refreshTokenRoute,
  signupRoute,
  verifyEmailRoute,
  resendVerificationEmailRoute,
  requestPasswordResetRoute,
  resetPasswordRoute,
]

export const userRoutesAllowNew = [meRoute]

export const userRoutesVerifiedOnly = [teamsRoute]

export const adminRoutes = [adminTeamsRoute, adminUsersRoute]

export const ownerRoutes = [ownerAdminsRoute]
