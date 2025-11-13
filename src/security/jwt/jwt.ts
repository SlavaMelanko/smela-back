import { sign, verify } from 'hono/jwt'

import { AppError, ErrorCode } from '@/errors'

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
  const options = mergeWithDefaults(userOptions)
  const secrets = [options.secret, options.previousSecret].filter(Boolean) as string[]

  for (const secret of secrets) {
    try {
      const payload = await verify(token, secret, options.signatureAlgorithm)
      const { userClaims } = parse(payload)

      return userClaims
    } catch {
      // try next secret
    }
  }

  throw new AppError(ErrorCode.Unauthorized, 'Invalid authentication token')
}
