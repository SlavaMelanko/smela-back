import { eq } from 'drizzle-orm'

import type { Database } from '../../clients'
import type { CreateUserRoleInput, UserRoleRecord } from './types'

import { db } from '../../clients'
import { userRolesTable } from '../../schema'

export const assign = async (
  input: CreateUserRoleInput,
  tx?: Database,
): Promise<UserRoleRecord> => {
  const executor = tx || db

  const [created] = await executor
    .insert(userRolesTable)
    .values(input)
    .returning()

  return created
}

export const remove = async (
  userId: string,
  tx?: Database,
): Promise<void> => {
  const executor = tx || db

  await executor
    .delete(userRolesTable)
    .where(eq(userRolesTable.userId, userId))
}
