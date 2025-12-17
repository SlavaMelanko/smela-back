import {
  index,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

import { TokenStatus, TokenType } from '@/security/token'

import { createPgEnum } from '../utils'
import { usersTable } from './users'

export const tokenTypeEnum = createPgEnum('token_type', TokenType)
export const tokenStatusEnum = createPgEnum('token_status', TokenStatus)

export const tokensTable = pgTable('tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  type: tokenTypeEnum('type').notNull().$type<TokenType>(),
  status: tokenStatusEnum('status').notNull().default(TokenStatus.Pending).$type<TokenStatus>(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('user_type_index').on(table.userId, table.type),
  index('tokens_status_expires_index').on(table.status, table.expiresAt),
])
