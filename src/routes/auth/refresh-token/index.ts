import { Hono } from 'hono'

import refreshTokenHandler from './handler'

const refreshToken = new Hono()

refreshToken.post('/refresh-token', refreshTokenHandler)

export default refreshToken
