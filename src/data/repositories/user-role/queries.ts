import { eq } from 'drizzle-orm'

import type { Database } from '../../clients'
import type { UserRoleRecord } from './types'

import { db } from '../../clients'
import { userRolesTable } from '../../schema'

export const findByUserId = async (
  userId: string,
  tx?: Database,
): Promise<UserRoleRecord | undefined> => {
  const executor = tx || db

  const [found] = await executor
    .select()
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, userId))

  return found
}
