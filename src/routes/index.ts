import loginRoute from './login'
import meRoute from './me'
import requestPasswordResetRoute from './request-password-reset'
import resendVerificationEmailRoute from './resend-verification-email'
import signupRoute from './signup'
import verifyEmailRoute from './verify-email'

export const publicRoutes = []
export const authRoutes = [loginRoute, signupRoute, verifyEmailRoute, resendVerificationEmailRoute, requestPasswordResetRoute]
export const protectedRoutes = [meRoute]
