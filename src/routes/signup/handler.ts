import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { getReasonPhrase, StatusCodes } from 'http-status-codes'

import HttpError from '@/lib/http-error'
import logger from '@/lib/logger'

import signUp from './signup'

const signupHandler = async (c: Context) => {
  try {
    const { firstName, lastName, email, password } = await c.req.json()

    const newUser = await signUp(firstName, lastName, email, password)

    return c.json({ user: newUser }, StatusCodes.CREATED)
  } catch (err) {
    logger.error(err)

    if (err instanceof HttpError) {
      return c.json({ error: err.message }, <ContentfulStatusCode>err.status)
    }

    return c.json(
      { error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) },
      StatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}

export default signupHandler
