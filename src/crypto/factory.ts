import type Hasher from './hasher'
import type RandomBytesGenerator from './random-bytes-generator'

import BcryptHasher from './hasher-bcrypt'
import Sha256Hasher from './hasher-sha256'
import CryptoRandomBytesGenerator from './random-bytes-generator-crypto'

export const createHasher = (algo: 'bcrypt' | 'sha256' = 'bcrypt'): Hasher => {
  switch (algo) {
    case 'bcrypt':
      return new BcryptHasher()
    case 'sha256':
      return new Sha256Hasher()
    default:
      throw new Error(`Unknown hasher: ${algo as string}`)
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
