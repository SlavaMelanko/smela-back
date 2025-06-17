import type PasswordEncoder from './password-encoder'

import { BcryptEncoder } from './bcrypt-encoder'

export function createPasswordEncoder(impl: 'bcrypt' = 'bcrypt'): PasswordEncoder {
  switch (impl) {
    case 'bcrypt':
      return new BcryptEncoder()
    default:
      throw new Error(`Unknown password encoder: ${impl}`)
  }
}
