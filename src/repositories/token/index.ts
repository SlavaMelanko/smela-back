import {
  createToken,
  deprecateOldTokens,
  findByToken,
  updateToken,
} from './queries'

export * from './types'

export const tokenRepo = {
  deprecateOld: deprecateOldTokens,
  create: createToken,
  findByToken,
  update: updateToken,
}
