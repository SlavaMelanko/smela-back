import { eq } from 'drizzle-orm'

import { AppError, ErrorCode } from '@/errors'

import type { Database } from '../../clients'
import type { CreateUserInput, UpdateUserInput, User } from './types'

import { db } from '../../clients'
import { usersTable } from '../../schema'
import { findUserById, toTypeSafeUser } from './queries'

export const createUser = async (user: CreateUserInput, tx?: Database): Promise<User> => {
  const executor = tx || db

  const [createdUser] = await executor
    .insert(usersTable)
    .values(user)
    .returning()

  if (!createdUser) {
    throw new AppError(ErrorCode.InternalError, 'Failed to create user')
  }

  return toTypeSafeUser(createdUser) as User
}

export const updateUser = async (
  userId: number,
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

  return toTypeSafeUser(updatedUser) as User
}

export const incrementTokenVersion = async (userId: number, tx?: Database): Promise<void> => {
  const user = await findUserById(userId, tx)

  if (!user) {
    throw new AppError(ErrorCode.NotFound, 'User not found')
  }

  await updateUser(userId, {
    tokenVersion: user.tokenVersion + 1,
  }, tx)
}
