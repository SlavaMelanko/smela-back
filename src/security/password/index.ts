import { createHasher } from '@/crypto'

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Z\d@$!%*#?&]{8,}$/i

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
