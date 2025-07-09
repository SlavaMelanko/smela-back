export * from './types'

import {
  createToken,
  findByToken,
  findByUserAndType,
  markAsUsed,
  updateToken,
} from './queries'

export const secureTokenRepo = {
  create: createToken,
  findByToken,
  findByUserAndType,
  markAsUsed,
  update: updateToken,
}
