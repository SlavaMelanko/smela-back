import loginRoute from './login'
import logoutRoute from './logout'
import meRoute from './me'
import requestPasswordResetRoute from './request-password-reset'
import resendVerificationEmailRoute from './resend-verification-email'
import resetPasswordRoute from './reset-password'
import signupRoute from './signup'
import verifyEmailRoute from './verify-email'

export const publicRoutes = []
export const authRoutes = [loginRoute, logoutRoute, signupRoute, verifyEmailRoute, resendVerificationEmailRoute, requestPasswordResetRoute, resetPasswordRoute]
export const protectedRoutes = [meRoute]
