import { createToken, replaceToken, updateToken } from './mutations'
import { findByToken } from './queries'

export * from './types'

export const tokenRepo = {
  create: createToken,
  replace: replaceToken,
  findByToken,
  update: updateToken,
}
