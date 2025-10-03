import {
  integer,
  pgTable,
  serial,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { Action, Resource } from '@/types'

import { createPgEnum } from '../utils'
import { roleEnum } from './users'

export const actionEnum = createPgEnum('action', Action)
export const resourceEnum = createPgEnum('resource', Resource)

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

export { roleEnum }
