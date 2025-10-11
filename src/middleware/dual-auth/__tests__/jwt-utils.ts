import type { Options } from '@/jwt'

export const jwtOptions: Partial<Options> = {
  secret: 'test-jwt-secret-key-for-dual-auth-middleware-tests',
}
