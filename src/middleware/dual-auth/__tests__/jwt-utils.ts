import type { Options } from '@/security/jwt'

export const jwtOptions: Partial<Options> = {
  secret: 'test-jwt-secret-key-for-dual-auth-middleware-tests',
}
