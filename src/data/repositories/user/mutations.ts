import { eq, sql } from 'drizzle-orm'

import { AppError, ErrorCode } from '@/errors'
import { Role } from '@/types'

import type { Database } from '../../clients'
import type { CreateUserInput, UpdateUserInput, User } from './types'

import { db } from '../../clients'
import { userRoleTable, usersTable } from '../../schema'

export const createUser = async (user: CreateUserInput, tx?: Database): Promise<User> => {
  const executor = tx || db

  const [createdUser] = await executor
    .insert(usersTable)
    .values(user)
    .returning()

  if (!createdUser) {
    throw new AppError(ErrorCode.InternalError, 'Failed to create user')
  }

  // New users default to Role.User
  return { ...createdUser, role: Role.User }
}

export const updateUser = async (
  userId: string,
  updates: UpdateUserInput,
  tx?: Database,
): Promise<User> => {
  const executor = tx || db

  const updatedCte = executor.$with('updated').as(
    executor
      .update(usersTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning(),
  )

  const [updatedUser] = await executor
    .with(updatedCte)
    .select({
      id: updatedCte.id,
      firstName: updatedCte.firstName,
      lastName: updatedCte.lastName,
      email: updatedCte.email,
      status: updatedCte.status,
      createdAt: updatedCte.createdAt,
      updatedAt: updatedCte.updatedAt,
      role: sql<Role>`COALESCE(${userRoleTable.role}, ${Role.User})`,
    })
    .from(updatedCte)
    .leftJoin(userRoleTable, eq(updatedCte.id, userRoleTable.userId))

  if (!updatedUser) {
    throw new AppError(ErrorCode.InternalError, 'Failed to update user')
  }

  return updatedUser
}
