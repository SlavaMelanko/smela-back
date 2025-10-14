import type Hasher from './hasher'
import type RandomBytesGenerator from './random-bytes-generator'

import BcryptHasher from './hasher-bcrypt'
import CryptoRandomBytesGenerator from './random-bytes-generator-crypto'

export const createHasher = (impl: 'bcrypt' = 'bcrypt'): Hasher => {
  switch (impl) {
    case 'bcrypt':
      return new BcryptHasher()
    default:
      throw new Error(`Unknown hasher: ${impl as string}`)
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
