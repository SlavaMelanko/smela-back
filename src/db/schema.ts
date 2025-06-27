import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

import { Action, AuthProvider, Resource, Status } from '@/types'

export const actionEnum = pgEnum('action', Object.values(Action) as [string, ...string[]])
export const authProviderEnum = pgEnum('auth_provider', Object.values(AuthProvider) as [string, ...string[]])
export const resourceEnum = pgEnum('resource', Object.values(Resource) as [string, ...string[]])
export const statusEnum = pgEnum('status', Object.values(Status) as [string, ...string[]])

export const rolesTable = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
})

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  roleId: integer('role_id').notNull().references(() => rolesTable.id),
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
  roleId: integer('role_id').notNull().references(() => rolesTable.id),
  permissionId: integer('permission_id').notNull().references(() => permissionsTable.id),
}, table => ({
  uniqueRolePermission: uniqueIndex('unique_role_permission').on(table.roleId, table.permissionId),
}))
