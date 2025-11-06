import { compare as bcryptCompare, hash as bcryptHash } from 'bcrypt'

import type Hasher from './hasher'

class BcryptHasher implements Hasher {
  private readonly saltRounds: number

  constructor(saltRounds: number = 10) {
    this.saltRounds = saltRounds
  }

  async hash(plain: string): Promise<string> {
    return bcryptHash(plain, this.saltRounds)
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcryptCompare(plain, hashed)
  }
}

export default BcryptHasher
