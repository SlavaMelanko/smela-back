import type { Context } from 'hono'

import { StatusCodes } from 'http-status-codes'

import signUp from './signup'

const signupHandler = async (c: Context) => {
  const { firstName, lastName, email, password, role } = await c.req.json()

  const user = await signUp({ firstName, lastName, email, password, role })

  return c.json({ user }, StatusCodes.CREATED)
}

export default signupHandler
