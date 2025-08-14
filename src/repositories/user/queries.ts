import { eq } from 'drizzle-orm'

import type { Role, Status } from '@/types'

import db, { usersTable } from '@/db'
import { AppError, ErrorCode } from '@/lib/catch'

import type { CreateUserInput, UpdateUserInput, User, UserRecord } from './types'

const toTypeSafeUser = (user: UserRecord): User | undefined => {
  if (!user) {
    return undefined
  }

  return {
    ...user,
    status: user.status as Status,
    role: user.role as Role,
  }
}

const createUser = async (user: CreateUserInput): Promise<User | undefined> => {
  const [createdUser] = await db
    .insert(usersTable)
    .values(user)
    .returning()

  return toTypeSafeUser(createdUser)
}

const findUserById = async (userId: number): Promise<User | undefined> => {
  const [foundUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))

  return toTypeSafeUser(foundUser)
}

const findUserByEmail = async (email: string): Promise<User | undefined> => {
  const [foundUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))

  return toTypeSafeUser(foundUser)
}

const updateUser = async (userId: number, updates: UpdateUserInput): Promise<User | undefined> => {
  const [updatedUser] = await db
    .update(usersTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning()

  return toTypeSafeUser(updatedUser)
}

// Increment token version to invalidate all existing JWTs.
const incrementTokenVersion = async (userId: number): Promise<void> => {
  const user = await findUserById(userId)

  if (!user) {
    throw new AppError(ErrorCode.NotFound, 'User not found')
  }

  const updatedUser = await updateUser(userId, {
    tokenVersion: user.tokenVersion + 1,
  })

  if (!updatedUser) {
    throw new AppError(ErrorCode.InternalError)
  }
}

export { createUser, findUserByEmail, findUserById, incrementTokenVersion, updateUser }
