import { HttpStatus } from '@/net/http'
import signUpWithEmail from '@/use-cases/auth/signup'

import type { SignupCtx } from './schema'

export const signupHandler = async (c: SignupCtx) => {
  const { firstName, lastName, email, password, preferences } = c.req.valid('json')

  const result = await signUpWithEmail({ firstName, lastName, email, password }, preferences)

  return c.json(result, HttpStatus.CREATED)
}
