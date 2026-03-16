import { sql } from 'drizzle-orm'
import {
  index,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { AuthProvider } from '@/types'

import { createPgEnum } from '../utils'
import { usersTable } from './users'

export const authProviderEnum = createPgEnum('auth_provider', AuthProvider)

export const authTable = pgTable('auth', {
  userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  provider: authProviderEnum('provider').notNull().$type<AuthProvider>(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  primaryKey({ columns: [table.provider, table.identifier] }),
  index('auth_user_id_index').on(table.userId),
  sql`CHECK ((provider != 'local') OR (password_hash IS NOT NULL))`,
])
