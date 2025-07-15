import loginRoute from './login'
import meRoute from './me'
import resendVerificationEmailRoute from './resend-verification-email'
import signupRoute from './signup'
import verifyEmailRoute from './verify-email'

export const publicRoutes = []
export const authRoutes = [loginRoute, signupRoute, verifyEmailRoute, resendVerificationEmailRoute]
export const protectedRoutes = [meRoute]
