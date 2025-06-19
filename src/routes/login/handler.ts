import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { getReasonPhrase, StatusCodes } from 'http-status-codes'

import HttpError from '@/lib/http-error'
import logger from '@/lib/logger'

import logIn from './login'

const loginHandler = async (c: Context) => {
  try {
    const { email, password } = await c.req.json()

    const token = await logIn({ email, password })

    return c.json({ token }, StatusCodes.OK)
  } catch (err) {
    logger.error(err)

    if (err instanceof HttpError) {
      return c.json({ error: err.message }, <ContentfulStatusCode>err.status)
    }

    return c.json(
      { error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) },
      { status: StatusCodes.INTERNAL_SERVER_ERROR },
    )
  }
}

export default loginHandler
