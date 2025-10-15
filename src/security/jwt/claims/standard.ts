import { z } from 'zod'

import { nowInSeconds } from '@/utils/chrono'

export const standardClaimsSchema = z.object({
  iat: z.number(),
  nbf: z.number(),
  exp: z.number(),
})

export type StandardClaims = z.infer<typeof standardClaimsSchema>

export const createStandardClaims = (expiresIn: number): StandardClaims => {
  const now = nowInSeconds()

  return {
    iat: now,
    nbf: now,
    exp: now + expiresIn,
  }
}

export const getStandardClaims = (payload: unknown): StandardClaims =>
  standardClaimsSchema.parse(payload)
