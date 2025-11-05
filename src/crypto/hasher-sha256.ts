import { createHash } from 'node:crypto'

import type Hasher from './hasher'

class Sha256Hasher implements Hasher {
  async hash(plain: string): Promise<string> {
    return createHash('sha256').update(plain).digest('hex')
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    const plainHashed = await this.hash(plain)

    return plainHashed === hashed
  }
}

export default Sha256Hasher
