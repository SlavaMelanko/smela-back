import {
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

import { Action, AuthProvider, Resource, Role, SecureToken, Status } from '@/types'

const createPgEnum = <T extends Record<string, string>>(name: string, enumObj: T) => {
  const values = Object.values(enumObj)

  return pgEnum(name, values as [string, ...string[]])
}

export const actionEnum = createPgEnum('action', Action)
export const authProviderEnum = createPgEnum('auth_provider', AuthProvider)
export const resourceEnum = createPgEnum('resource', Resource)
export const statusEnum = createPgEnum('status', Status)
export const roleEnum = createPgEnum('role', Role)
export const secureTokenEnum = createPgEnum('secure_token', SecureToken)

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: roleEnum('role').notNull().default(Role.User),
  status: statusEnum('status').notNull().default(Status.New),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  emailIndex: index('email_index').on(table.email),
}))

export const authTable = pgTable('auth', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => usersTable.id),
  provider: authProviderEnum('provider').notNull(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  uniqueAuth: uniqueIndex('unique_auth').on(table.provider, table.identifier),
}))

export const permissionsTable = pgTable('permissions', {
  id: serial('id').primaryKey(),
  action: actionEnum('action').notNull(),
  resource: resourceEnum('resource').notNull(),
}, table => ({
  uniquePermission: uniqueIndex('unique_permission').on(table.action, table.resource),
}))

export const rolePermissionsTable = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  role: roleEnum('role').notNull(),
  permissionId: integer('permission_id').notNull().references(() => permissionsTable.id),
}, table => ({
  uniqueRolePermission: uniqueIndex('unique_role_permission').on(table.role, table.permissionId),
}))

export const secureTokensTable = pgTable('secure_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => usersTable.id),
  type: secureTokenEnum('type').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  tokenIndex: uniqueIndex('token_index').on(table.token),
  userTypeIndex: index('user_type_index').on(table.userId, table.type),
}))
