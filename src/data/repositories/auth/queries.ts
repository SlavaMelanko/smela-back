import { eq } from 'drizzle-orm'

import type { AuthProvider } from '@/types'

import type { Database } from '../../clients'
import type { Auth, AuthRecord } from './types'

import { db } from '../../clients'
import { authTable } from '../../schema'

export const toTypeSafeAuth = (auth: AuthRecord): Auth => {
  return {
    ...auth,
    provider: auth.provider as AuthProvider,
  }
}

export const findByUserId = async (
  userId: number,
  tx?: Database,
): Promise<Auth | undefined> => {
  const executor = tx || db

  const [foundAuth] = await executor
    .select()
    .from(authTable)
    .where(eq(authTable.userId, userId))

  return foundAuth ? toTypeSafeAuth(foundAuth) : undefined
}
