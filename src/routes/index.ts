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

const protectedRoutes = [meRoute]

const publicRoutes = []

export {
  authRoutes,
  protectedRoutes,
  publicRoutes,
}
