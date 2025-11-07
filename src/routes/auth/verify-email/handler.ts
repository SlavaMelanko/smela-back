import type { Context } from 'hono'

import { HttpStatus, setAccessCookie } from '@/net/http'
import verifyEmail from '@/use-cases/auth/verify-email'

import type { VerifyEmailBody } from './schema'

const verifyEmailHandler = async (c: Context) => {
  const { token } = await c.req.json<VerifyEmailBody>()

  const { data, accessToken } = await verifyEmail(token)

  setAccessCookie(c, accessToken)

  return c.json(data, HttpStatus.OK)
}

export default verifyEmailHandler
