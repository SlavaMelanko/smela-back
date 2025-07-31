import { sign, verify } from 'hono/jwt'

import env from './env'

const TOKEN_EXPIRATION_TIME = 60 * 60 // 1 hour

const getSecret = () => env.JWT_SECRET

const signJwt = (id: number, email: string, role: string, status: string, tokenVersion: number): Promise<string> => {
  const payload = {
    id,
    email,
    role,
    status,
    v: tokenVersion,
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION_TIME,
  }

  return sign(payload, getSecret())
}

const verifyJwt = (token: string) => {
  return verify(token, getSecret())
}

const jwt = {
  sign: signJwt,
  verify: verifyJwt,
}

export default jwt
