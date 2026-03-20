import {
  index,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import { TokenStatus, TokenType } from '@/security/token'

import { createPgEnum } from '../utils'
import { usersTable } from './users'

export const tokenTypeEnum = createPgEnum('token_type', TokenType)
export const tokenStatusEnum = createPgEnum('token_status', TokenStatus)

export const tokensTable = pgTable('tokens', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  type: tokenTypeEnum('type').notNull().$type<TokenType>(),
  status: tokenStatusEnum('status').notNull().default(TokenStatus.Pending).$type<TokenStatus>(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('tokens_user_id_type_index').on(table.userId, table.type),
])
