import {
  boolean,
  integer,
  pgTable,
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

export const permissionsTable = pgTable('permissions', {
  id: serial('id').primaryKey(),
  action: actionEnum('action').notNull().$type<Action>(),
  resource: resourceEnum('resource').notNull().$type<Resource>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex('unique_permission').on(table.action, table.resource),
])

export const userPermissionsTable = pgTable('user_permissions', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  permissionId: integer('permission_id')
    .notNull()
    .references(() => permissionsTable.id, { onDelete: 'cascade' }),
  granted: boolean('granted').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex('unique_user_permission').on(table.userId, table.permissionId),
])
