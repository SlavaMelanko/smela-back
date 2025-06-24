import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

import { Action, AuthProvider } from '@/types'

export const actionTypeEnum = pgEnum('action_type', Object.values(Action) as [string, ...string[]])

export const authProviderEnum = pgEnum('auth_provider', Object.values(AuthProvider) as [string, ...string[]])

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

export const resourcesTable = pgTable('resources', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
})

export const permissionsTable = pgTable('permissions', {
  id: serial('id').primaryKey(),
  action: actionTypeEnum('action_type').notNull(),
  resourceId: integer('resource_id')
    .notNull()
    .references(() => resourcesTable.id),
})

export const rolePermissionsTable = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id').notNull().references(() => rolesTable.id),
  permissionId: integer('permission_id').notNull().references(() => permissionsTable.id),
})
