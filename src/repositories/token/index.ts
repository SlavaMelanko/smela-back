import { createToken, deprecateOldTokens, updateToken } from './mutations'
import { findByToken } from './queries'

export * from './types'

export const tokenRepo = {
  deprecateOld: deprecateOldTokens,
  create: createToken,
  findByToken,
  update: updateToken,
}
