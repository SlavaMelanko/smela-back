import loginRoute from './login'
import meRoute from './me'
import signupRoute from './signup'

export const publicRoutes = [loginRoute, signupRoute]
export const privateRoutes = [meRoute]
