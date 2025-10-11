import { z } from 'zod'

export const standardClaimsSchema = z.object({
  iat: z.number(),
  nbf: z.number(),
  exp: z.number(),
})

export type StandardClaims = z.infer<typeof standardClaimsSchema>

export const createStandardClaims = (expiresIn: number): StandardClaims => {
  const nowInSeconds = Math.floor(Date.now() / 1000)

  return {
    iat: nowInSeconds,
    nbf: nowInSeconds,
    exp: nowInSeconds + expiresIn,
  }
}

export const getStandardClaims = (payload: unknown): StandardClaims =>
  standardClaimsSchema.parse(payload)
