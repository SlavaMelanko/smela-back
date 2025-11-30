import { sql } from 'drizzle-orm'
import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

import { AuthProvider } from '@/types'

import { createPgEnum } from '../utils'
import { usersTable } from './users'

export const authProviderEnum = createPgEnum('auth_provider', AuthProvider)

export const authTable = pgTable('auth', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  provider: authProviderEnum('provider').notNull(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex('unique_auth').on(table.provider, table.identifier),
  index('auth_user_id_index').on(table.userId),
  sql`CHECK ((provider != 'local') OR (password_hash IS NOT NULL))`,
])
