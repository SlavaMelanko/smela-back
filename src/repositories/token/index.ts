export * from './types'

import {
  createToken,
  findByToken,
  updateToken,
} from './queries'

export const secureTokenRepo = {
  create: createToken,
  findByToken,
  update: updateToken,
}
