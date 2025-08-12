import type { Context } from 'hono'

import { StatusCodes } from 'http-status-codes'

import signUpWithEmail from './signup'

const signupHandler = async (c: Context) => {
  const { firstName, lastName, email, password, role } = await c.req.json()

  const result = await signUpWithEmail({ firstName, lastName, email, password, role })

  return c.json(result, StatusCodes.CREATED)
}

export default signupHandler
