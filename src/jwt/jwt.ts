import { sign, verify } from 'hono/jwt'
import { ZodError } from 'zod'

import { AppError, ErrorCode } from '@/lib/catch'

import type { UserClaims } from './claims'
import type { Options } from './options'
import type { UserPayload } from './payload'

import { EXPIRES_IN_ONE_HOUR } from './options'
import { parse } from './payload'

export const signJwt = async (
  claims: UserClaims,
  options: Options,
): Promise<string> => {
  const expiresIn = options.expiresIn ?? EXPIRES_IN_ONE_HOUR

  const payload = {
    id: claims.id,
    email: claims.email,
    role: claims.role,
    status: claims.status,
    v: claims.tokenVersion,
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  }

  return sign(payload, options.secret)
}

export const verifyJwt = async (
  token: string,
  options: Options,
): Promise<UserPayload> => {
  try {
    const payload = await verify(token, options.secret)

    return parse(payload)
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      throw new AppError(ErrorCode.Unauthorized, 'Invalid token payload structure')
    }

    throw new AppError(ErrorCode.Unauthorized, 'Invalid authentication token')
  }
}
