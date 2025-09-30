import { eq } from 'drizzle-orm'

import type { Transaction } from '@/db'

import db, { usersTable } from '@/db'
import { AppError, ErrorCode } from '@/lib/catch'

import type { CreateUserInput, UpdateUserInput, User } from './types'

import { findUserById, toTypeSafeUser } from './queries'

export const createUser = async (user: CreateUserInput, tx?: Transaction): Promise<User> => {
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

export const updateUser = async (userId: number, updates: UpdateUserInput, tx?: Transaction): Promise<User> => {
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

export const incrementTokenVersion = async (userId: number, tx?: Transaction): Promise<void> => {
  const user = await findUserById(userId)

  if (!user) {
    throw new AppError(ErrorCode.NotFound, 'User not found')
  }

  await updateUser(userId, {
    tokenVersion: user.tokenVersion + 1,
  }, tx)
}
