import { createHasher } from '@/crypto'

export const hashToken = async (token: string): Promise<string> => {
  if (!token || token.trim().length === 0) {
    throw new Error('Token must be a non-empty string')
  }

  const hasher = createHasher('sha256')

  return hasher.hash(token)
}

export const compareHash = async (plain: string, hashed: string): Promise<boolean> => {
  if (!plain || plain.trim().length === 0) {
    throw new Error('Plain token must be a non-empty string')
  }

  if (!hashed || hashed.trim().length === 0) {
    throw new Error('Hashed token must be a non-empty string')
  }

  const hasher = createHasher('sha256')

  return hasher.compare(plain, hashed)
}
