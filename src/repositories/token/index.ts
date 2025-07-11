export * from './types'

import {
  createToken,
  deprecateOldTokens,
  findByToken,
  updateToken,
} from './queries'

export const tokenRepo = {
  deprecateOld: deprecateOldTokens,
  create: createToken,
  findByToken,
  update: updateToken,
}
