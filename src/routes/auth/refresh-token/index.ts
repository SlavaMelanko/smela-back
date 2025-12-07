import { Hono } from 'hono'

import type { AppContext } from '@/context'

import refreshTokenHandler from './handler'

const refreshToken = new Hono<AppContext>()

refreshToken.post('/refresh-token', refreshTokenHandler)

export default refreshToken
