import {
  integer,
  pgTable,
  primaryKey,
  serial,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { Action, Resource, Role } from '@/types'

import { createPgEnum } from '../utils'
import { usersTable } from './users'

export const roleEnum = createPgEnum('role', Role)
export const actionEnum = createPgEnum('action', Action)
export const resourceEnum = createPgEnum('resource', Resource)

export const userRoleTable = pgTable('user_role', {
  userId: uuid('user_id').primaryKey().references(() => usersTable.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull().$type<Role>(),
  invitedBy: uuid('invited_by').references(() => usersTable.id, { onDelete: 'set null' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
})

export const permissionsTable = pgTable('permissions', {
  id: serial('id').primaryKey(),
  action: actionEnum('action').notNull().$type<Action>(),
  resource: resourceEnum('resource').notNull().$type<Resource>(),
}, table => [
  uniqueIndex('unique_permission').on(table.action, table.resource),
])

export const userPermissionsTable = pgTable('user_permissions', {
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  permissionId: integer('permission_id')
    .notNull()
    .references(() => permissionsTable.id, { onDelete: 'cascade' }),
}, table => [
  primaryKey({ columns: [table.userId, table.permissionId] }),
])
