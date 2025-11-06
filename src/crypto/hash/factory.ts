import type Hasher from './hasher'

import BcryptHasher from './hasher-bcrypt'
import NodeHasher from './hasher-node'

export const createHasher = (algorithm: 'bcrypt' | 'sha256' | 'sha512' = 'bcrypt'): Hasher => {
  switch (algorithm) {
    case 'bcrypt':
      return new BcryptHasher()
    case 'sha256':
      return new NodeHasher('sha256')
    case 'sha512':
      return new NodeHasher('sha512')
    default:
      throw new Error(`Unknown algorithm: ${algorithm as string}`)
  }
}
