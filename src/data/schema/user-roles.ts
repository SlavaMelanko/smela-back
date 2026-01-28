import {
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import type { Role } from '@/types'

import { roleEnum } from './rbac'
import { usersTable } from './users'

export const userRolesTable = pgTable('user_roles', {
  userId: uuid('user_id').primaryKey().references(() => usersTable.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull().$type<Role>(),
  invitedBy: uuid('invited_by').references(() => usersTable.id, { onDelete: 'set null' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
})
