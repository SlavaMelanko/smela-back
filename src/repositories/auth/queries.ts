import db, { authTable } from '@/db'

import type { CreateAuthInput } from './types'

const createAuth = async (auth: CreateAuthInput): Promise<number> => {
  const [createdAuth] = await db
    .insert(authTable)
    .values(auth)
    .returning({ id: authTable.id })

  return createdAuth.id
}

export { createAuth }
