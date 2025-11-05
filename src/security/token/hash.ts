import { createHasher } from '@/crypto'

export const hashToken = async (token: string): Promise<string> => {
  if (!token || token.trim().length === 0) {
    throw new Error('Token must be a non-empty string')
  }

  const hasher = createHasher('sha256')

  return hasher.hash(token)
}
