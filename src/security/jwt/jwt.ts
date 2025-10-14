import { sign, verify } from 'hono/jwt'
import { ZodError } from 'zod'

import { AppError, ErrorCode } from '@/errors'
import { logger } from '@/logging'

import type { UserClaims } from './claims'
import type { Options } from './options'

import { createStandardClaims } from './claims'
import { mergeWithDefaults } from './options'
import { parse } from './payload'

export const signJwt = async (
  userClaims: UserClaims,
  userOptions?: Partial<Options>,
): Promise<string> => {
  const options = mergeWithDefaults(userOptions)
  const standardClaims = createStandardClaims(options.expiresIn)

  const payload = {
    ...userClaims,
    ...standardClaims,
  }

  return sign(payload, options.secret, options.signatureAlgorithm)
}

export const verifyJwt = async (
  token: string,
  userOptions?: Partial<Options>,
): Promise<UserClaims> => {
  try {
    const options = mergeWithDefaults(userOptions)

    const payload = await verify(token, options.secret, options.signatureAlgorithm)

    const { userClaims } = parse(payload)

    return userClaims
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
