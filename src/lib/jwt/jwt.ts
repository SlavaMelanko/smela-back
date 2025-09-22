import { sign, verify } from 'hono/jwt'
import { ZodError } from 'zod'

import type { Role, Status, UserPayload } from '@/types'

import { AppError, ErrorCode } from '@/lib/catch'
import env from '@/lib/env'

import { parsePayload } from './payload'

const getSecret = () => env.JWT_ACCESS_SECRET

export const signJwt = (id: number, email: string, role: Role, status: Status, tokenVersion: number): Promise<string> => {
  const payload = {
    id,
    email,
    role,
    status,
    v: tokenVersion,
    exp: Math.floor(Date.now() / 1000) + env.JWT_ACCESS_EXPIRATION,
  }

  return sign(payload, getSecret())
}

export const verifyJwt = async (token: string): Promise<UserPayload> => {
  try {
    const payload = await verify(token, getSecret())

    return parsePayload(payload)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(ErrorCode.Unauthorized, 'Invalid token payload structure')
    }

    throw new AppError(ErrorCode.Unauthorized, 'Invalid authentication token')
  }
}
