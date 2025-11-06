import { Buffer } from 'node:buffer'
import { createHash, timingSafeEqual } from 'node:crypto'

import type Hasher from './hasher'

export type HashAlgorithm = 'sha256' | 'sha512'

export type DigestEncoding = 'hex' | 'base64' | 'base64url'

class NodeHasher implements Hasher {
  private readonly algorithm: HashAlgorithm
  private readonly digest: DigestEncoding

  constructor(algorithm: HashAlgorithm = 'sha256', digest: DigestEncoding = 'hex') {
    this.algorithm = algorithm
    this.digest = digest
  }

  async hash(plain: string): Promise<string> {
    return createHash(this.algorithm).update(plain).digest(this.digest)
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    const plainHashed = await this.hash(plain)

    const a = Buffer.from(plainHashed)
    const b = Buffer.from(hashed)

    if (a.length !== b.length) {
      return false
    }

    return timingSafeEqual(a, b)
  }
}

export default NodeHasher
