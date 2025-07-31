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

// Increment token version to invalidate all existing JWTs.
const incrementTokenVersion = async (userId: number): Promise<void> => {
  const user = await findUserById(userId)

  if (!user) {
    throw new Error('User not found')
  }

  await updateUser(userId, {
    tokenVersion: user.tokenVersion + 1,
    updatedAt: new Date(),
  })
}

export { createUser, findUserByEmail, findUserById, incrementTokenVersion, updateUser }
