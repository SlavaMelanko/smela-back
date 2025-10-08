import type PasswordEncoder from './password-encoder'
import type RandomBytesGenerator from './random-bytes-generator'

import BcryptPasswordEncoder from './password-encoder-bcrypt'
import CryptoRandomBytesGenerator from './random-bytes-generator-crypto'

export const createPasswordEncoder = (impl: 'bcrypt' = 'bcrypt'): PasswordEncoder => {
  switch (impl) {
    case 'bcrypt':
      return new BcryptPasswordEncoder()
    default:
      throw new Error(`Unknown password encoder: ${impl as string}`)
  }
}

export const createRandomBytesGenerator = (impl: 'crypto' = 'crypto'): RandomBytesGenerator => {
  switch (impl) {
    case 'crypto':
      return new CryptoRandomBytesGenerator()
    default:
      throw new Error(`Unknown random bytes generator: ${impl as string}`)
  }
}
