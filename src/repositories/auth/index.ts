export * from './types'

import { createAuth } from './queries'

export const authRepo = {
  create: createAuth,
}
