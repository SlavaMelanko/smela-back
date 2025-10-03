import {
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

import { AuthProvider } from '@/types'

import { usersTable } from './users'
import { createPgEnum } from './utils'

export const authProviderEnum = createPgEnum('auth_provider', AuthProvider)

export const authTable = pgTable('auth', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => usersTable.id),
  provider: authProviderEnum('provider').notNull(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  uniqueAuth: uniqueIndex('unique_auth').on(table.provider, table.identifier),
}))
