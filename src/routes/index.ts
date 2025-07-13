import loginRoute from './login'
import meRoute from './me'
import signupRoute from './signup'
import verifyEmailRoute from './verify-email'

export const publicRoutes = []
export const authRoutes = [loginRoute, signupRoute, verifyEmailRoute]
export const privateRoutes = [meRoute]
