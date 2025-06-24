import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

import { Action, AuthProvider, Resource, Status } from '@/types'

export const actionEnum = pgEnum('action', Object.values(Action) as [string, ...string[]])
export const authProviderEnum = pgEnum('auth_provider', Object.values(AuthProvider) as [string, ...string[]])
export const resourceEnum = pgEnum('resource', Object.values(Resource) as [string, ...string[]])
export const statusEnum = pgEnum('status', Object.values(Status) as [string, ...string[]])

export const rolesTable = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
})

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  email: text('email').notNull().unique(),
  roleId: integer('role_id').notNull().references(() => rolesTable.id),
  status: statusEnum('status').notNull().default(Status.New),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const authTable = pgTable('auth', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => usersTable.id),
  provider: authProviderEnum('provider').notNull(),
  identifier: text('identifier').notNull(),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const permissionsTable = pgTable('permissions', {
  id: serial('id').primaryKey(),
  action: actionEnum('action').notNull(),
  resource: resourceEnum('resource').notNull(),
})

export const rolePermissionsTable = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id').notNull().references(() => rolesTable.id),
  permissionId: integer('permission_id').notNull().references(() => permissionsTable.id),
})
