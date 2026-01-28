import { sql } from 'drizzle-orm'
import {
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import type { Role } from '@/types'

import { roleEnum } from './rbac'
import { usersTable } from './users'

export const userRolesTable = pgTable('user_roles', {
  id: uuid('id').primaryKey().$defaultFn(() => sql`uuidv7()`),
  userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull().$type<Role>(),
  invitedBy: uuid('invited_by').references(() => usersTable.id, { onDelete: 'set null' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex('unique_user_role').on(table.userId),
])
