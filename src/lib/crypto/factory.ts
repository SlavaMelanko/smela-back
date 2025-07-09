import type PasswordEncoder from './password-encoder'

import BcryptPasswordEncoder from './bcrypt-password-encoder'
import SecureTokenGenerator from './secure-token-generator'

const createPasswordEncoder = (impl: 'bcrypt' = 'bcrypt'): PasswordEncoder => {
  switch (impl) {
    case 'bcrypt':
      return new BcryptPasswordEncoder()
    default:
      throw new Error(`Unknown password encoder: ${impl}`)
  }
}

const createSecureTokenGenerator = (impl: 'crypto' = 'crypto') => {
  switch (impl) {
    case 'crypto':
      return new SecureTokenGenerator()
    default:
      throw new Error(`Unknown secure token generator: ${impl}`)
  }
}

export { createPasswordEncoder, createSecureTokenGenerator }
