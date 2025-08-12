import type { Context } from 'hono'

import { StatusCodes } from 'http-status-codes'

import { setAuthCookie } from '@/lib/auth'

import verifyEmail from './verify-email'

const verifyEmailHandler = async (c: Context) => {
  const { token } = await c.req.json()

  const result = await verifyEmail(token)

  // Set cookie for web browser clients.
  setAuthCookie(c, result.token)

  // Return user and token in response body for CLI/mobile clients.
  return c.json(result, StatusCodes.OK)
}

export default verifyEmailHandler
