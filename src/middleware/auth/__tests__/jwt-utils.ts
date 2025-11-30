import type { Options } from '@/security/jwt'

export const jwtOptions: Partial<Options> = {
  secret: 'test-jwt-secret-key-for-auth-middleware-tests',
}
