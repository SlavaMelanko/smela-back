import { eq } from 'drizzle-orm'

import { AppError, ErrorCode } from '@/errors'

import type { Database } from '../../clients'
import type { CreateUserInput, UpdateUserInput, User } from './types'

import { db } from '../../clients'
import { usersTable } from '../../schema'

export const createUser = async (user: CreateUserInput, tx?: Database): Promise<User> => {
  const executor = tx || db

  const [createdUser] = await executor
    .insert(usersTable)
    .values(user)
    .returning()

  if (!createdUser) {
    throw new AppError(ErrorCode.InternalError, 'Failed to create user')
  }

  return createdUser
}

export const updateUser = async (
  userId: string,
  updates: UpdateUserInput,
  tx?: Database,
): Promise<User> => {
  const executor = tx || db

  const [updatedUser] = await executor
    .update(usersTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning()

  if (!updatedUser) {
    throw new AppError(ErrorCode.InternalError, 'Failed to update user')
  }

  return updatedUser
}

export const deleteUser = async (email: string, tx?: Database): Promise<void> => {
  const executor = tx || db

  await executor
    .delete(usersTable)
    .where(eq(usersTable.email, email))
}
