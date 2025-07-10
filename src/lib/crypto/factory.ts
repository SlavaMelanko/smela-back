import type PasswordEncoder from './password-encoder'

import BcryptPasswordEncoder from './password-encoder-bcrypt'
import CryptoTokenGenerator from './token-generator-crypto'

const createPasswordEncoder = (impl: 'bcrypt' = 'bcrypt'): PasswordEncoder => {
  switch (impl) {
    case 'bcrypt':
      return new BcryptPasswordEncoder()
    default:
      throw new Error(`Unknown password encoder: ${impl}`)
  }
}

const createTokenGenerator = (impl: 'crypto' = 'crypto') => {
  switch (impl) {
    case 'crypto':
      return new CryptoTokenGenerator()
    default:
      throw new Error(`Unknown token generator: ${impl}`)
  }
}

export { createPasswordEncoder, createTokenGenerator }
