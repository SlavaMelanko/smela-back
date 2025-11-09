import env from '@/env'

export type SignatureAlgorithm = 'HS256' | 'HS512'

export interface Options {
  secret: string
  expiresIn: number
  signatureAlgorithm: SignatureAlgorithm
}

const defaultOptions: Options = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRATION,
  signatureAlgorithm: env.JWT_SIGNATURE_ALGORITHM,
}

export const mergeWithDefaults = (options?: Partial<Options>): Options => {
  return {
    ...defaultOptions,
    ...options,
  }
}
