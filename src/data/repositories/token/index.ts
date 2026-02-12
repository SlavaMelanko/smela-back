import { createToken, issueToken, updateToken } from './mutations'
import { findByToken } from './queries'

export * from './types'

export const tokenRepo = {
  create: createToken,
  issue: issueToken,
  findByToken,
  update: updateToken,
}
