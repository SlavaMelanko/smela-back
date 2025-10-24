import { eq } from 'drizzle-orm'

import type { Role, Status } from '@/types'

import type { Database } from '../../clients'
import type { User, UserRecord } from './types'

import { db } from '../../clients'
import { usersTable } from '../../schema'

export const toTypeSafeUser = (user: UserRecord): User | undefined => {
  if (!user) {
    return undefined
  }

  return {
    ...user,
    status: user.status as Status,
    role: user.role as Role,
  }
}

export const findUserById = async (
  userId: number,
  tx?: Database,
): Promise<User | undefined> => {
  const executor = tx || db

  const [foundUser] = await executor
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))

  return toTypeSafeUser(foundUser)
}

export const findUserByEmail = async (
  email: string,
  tx?: Database,
): Promise<User | undefined> => {
  const executor = tx || db

  const [foundUser] = await executor
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))

  return toTypeSafeUser(foundUser)
}
