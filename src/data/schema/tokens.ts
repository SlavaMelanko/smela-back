import {
  index,
  integer,
  json,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

import { Token, TokenStatus } from '@/types'

import { createPgEnum } from '../utils'
import { usersTable } from './users'

export const tokenEnum = createPgEnum('token', Token)
export const tokenStatusEnum = createPgEnum('token_status', TokenStatus)

export const tokensTable = pgTable('tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => usersTable.id),
  type: tokenEnum('type').notNull(),
  status: tokenStatusEnum('status').notNull().default(TokenStatus.Pending),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  tokenIndex: uniqueIndex('token_index').on(table.token),
  userTypeIndex: index('user_type_index').on(table.userId, table.type),
}))
