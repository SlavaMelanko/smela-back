import { compare as bcryptCompare, hash as bcryptHash } from 'bcrypt'

import { PasswordEncoder } from './password-encoder'

const SALT_ROUNDS = 10

export class BcryptEncoder extends PasswordEncoder {
  async hash(plain: string): Promise<string> {
    return bcryptHash(plain, SALT_ROUNDS)
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcryptCompare(plain, hashed)
  }
}
