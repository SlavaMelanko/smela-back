import {
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { Action, Resource, Role } from '@/types'

import { createPgEnum } from '../utils'

export const roleEnum = createPgEnum('role', Role)
export const actionEnum = createPgEnum('action', Action)
export const resourceEnum = createPgEnum('resource', Resource)

export const permissionsTable = pgTable('permissions', {
  id: serial('id').primaryKey(),
  action: actionEnum('action').notNull(),
  resource: resourceEnum('resource').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  uniquePermission: uniqueIndex('unique_permission').on(table.action, table.resource),
}))

export const rolePermissionsTable = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  role: roleEnum('role').notNull(),
  permissionId: integer('permission_id').notNull().references(() => permissionsTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  uniqueRolePermission: uniqueIndex('unique_role_permission').on(table.role, table.permissionId),
}))
