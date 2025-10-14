import { compare as bcryptCompare, hash as bcryptHash } from 'bcrypt'

import type Hasher from './hasher'

const SALT_ROUNDS = 10

class BcryptHasher implements Hasher {
  async hash(plain: string): Promise<string> {
    return bcryptHash(plain, SALT_ROUNDS)
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcryptCompare(plain, hashed)
  }
}

export default BcryptHasher
