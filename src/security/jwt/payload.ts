import type { StandardClaims, UserClaims } from './claims'

import { getStandardClaims, getUserClaims } from './claims'

export const parse = (
  payload: unknown,
): { standardClaims: StandardClaims, userClaims: UserClaims } => {
  const standardClaims = getStandardClaims(payload)
  const userClaims = getUserClaims(payload)

  return {
    standardClaims,
    userClaims,
  }
}
