import { createHasher } from './factory'

export const hashPassword = async (password: string): Promise<string> => {
  const hasher = createHasher()

  return hasher.hash(password)
}

export const comparePasswords = async (password: string, hash: string): Promise<boolean> => {
  if (!password || !hash) {
    return false
  }

  const hasher = createHasher()

  return hasher.compare(password, hash)
}
