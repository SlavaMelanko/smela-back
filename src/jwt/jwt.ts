import { sign, verify } from 'hono/jwt'
import { ZodError } from 'zod'

import { AppError, ErrorCode } from '@/lib/catch'
import logger from '@/lib/logger'

import type { UserClaims } from './claims'
import type { Options } from './options'
import type { UserPayload } from './payload'

import { createStandardClaims, createUserClaims } from './claims'
import { EXPIRES_IN_ONE_HOUR } from './options'
import { parse } from './payload'

export const signJwt = async (
  claims: UserClaims,
  options: Options,
): Promise<string> => {
  const userClaims = createUserClaims(claims)

  const expiresIn = options.expiresIn ?? EXPIRES_IN_ONE_HOUR
  const standardClaims = createStandardClaims(expiresIn)

  const payload = {
    ...userClaims,
    ...standardClaims,
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
    logger.error(
      {
        error: (error instanceof ZodError) ? error.flatten().fieldErrors : error,
      },
      'JWT verification failed',
    )

    throw new AppError(ErrorCode.Unauthorized, 'Invalid authentication token')
  }
}
