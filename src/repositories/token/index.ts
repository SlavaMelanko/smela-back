import { createToken, deprecateOldTokens, replaceToken, updateToken } from './mutations'
import { findByToken } from './queries'

export * from './types'

export const tokenRepo = {
  deprecateOld: deprecateOldTokens,
  create: createToken,
  replace: replaceToken,
  findByToken,
  update: updateToken,
}
