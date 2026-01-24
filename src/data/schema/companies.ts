import { sql } from 'drizzle-orm'
import {
  index,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { usersTable } from './users'

export const companiesTable = pgTable('companies', {
  id: uuid('id').primaryKey().$defaultFn(() => sql`uuidv7()`),
  name: varchar('name', { length: 255 }).notNull().unique(),
  website: varchar('website', { length: 255 }).unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const userCompaniesTable = pgTable('user_companies', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companiesTable.id, { onDelete: 'cascade' }),
  position: varchar('position', { length: 100 }),
  invitedBy: uuid('invited_by').references(() => usersTable.id, { onDelete: 'set null' }),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex('unique_user_company').on(table.userId, table.companyId),
  index('user_companies_company_index').on(table.companyId),
  index('user_companies_user_index').on(table.userId),
])
