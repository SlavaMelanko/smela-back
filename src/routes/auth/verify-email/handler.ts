import type { Context } from 'hono'

import { setAccessCookie } from '@/net/http'
import HttpStatus from '@/types/http-status'

import type { VerifyEmailBody } from './schema'

import verifyEmail from './verify-email'

const verifyEmailHandler = async (c: Context) => {
  const { token } = await c.req.json<VerifyEmailBody>()

  const result = await verifyEmail(token)

  setAccessCookie(c, result.token)

  return c.json(result, HttpStatus.OK)
}

export default verifyEmailHandler
