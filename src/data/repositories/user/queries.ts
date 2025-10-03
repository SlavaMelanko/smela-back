import { eq } from 'drizzle-orm'

import type { Transaction } from '@/data'
import type { Role, Status } from '@/types'

import { db, usersTable } from '@/data'

import type { User, UserRecord } from './types'

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
  tx?: Transaction,
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
  tx?: Transaction,
): Promise<User | undefined> => {
  const executor = tx || db

  const [foundUser] = await executor
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))

  return toTypeSafeUser(foundUser)
}
