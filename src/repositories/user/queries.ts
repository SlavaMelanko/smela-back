import { eq } from 'drizzle-orm'

import db, { usersTable } from '@/db'

import type { CreateUserInput, UpdateUserInput, User, UserRecord } from './types'

const findUserByEmail = async (email: string): Promise<UserRecord | undefined> => {
  const [foundUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))

  return foundUser
}

const createUser = async (user: CreateUserInput): Promise<User> => {
  const [createdUser] = await db
    .insert(usersTable)
    .values(user)
    .returning({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      role: usersTable.role,
      status: usersTable.status,
      tokenVersion: usersTable.tokenVersion,
      createdAt: usersTable.createdAt,
    } as const)

  return createdUser
}

const findUserById = async (userId: number): Promise<UserRecord | undefined> => {
  const [foundUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))

  return foundUser
}

const updateUser = async (userId: number, updates: UpdateUserInput): Promise<void> => {
  await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
}

export { createUser, findUserByEmail, findUserById, updateUser }
