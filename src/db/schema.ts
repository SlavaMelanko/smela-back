import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const actionTypeEnum = pgEnum('action_type', ['view', 'create', 'edit', 'delete'])

export const rolesTable = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
})

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  roleId: integer('role_id').notNull().references(() => rolesTable.id),
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
