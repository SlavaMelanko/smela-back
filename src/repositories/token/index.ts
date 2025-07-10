export * from './types'

import {
  createToken,
  findByToken,
  updateToken,
} from './queries'

export const tokenRepo = {
  create: createToken,
  findByToken,
  update: updateToken,
}
