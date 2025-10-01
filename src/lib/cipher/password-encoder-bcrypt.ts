import { compare as bcryptCompare, hash as bcryptHash } from 'bcrypt'

import type PasswordEncoder from './password-encoder'

const SALT_ROUNDS = 10

class BcryptPasswordEncoder implements PasswordEncoder {
  async hash(plain: string): Promise<string> {
    return bcryptHash(plain, SALT_ROUNDS)
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcryptCompare(plain, hashed)
  }
}

export default BcryptPasswordEncoder
