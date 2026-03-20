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

export const teamsTable = pgTable('teams', {
  id: uuid('id').primaryKey().$defaultFn(() => sql`uuidv7()`),
  name: varchar('name', { length: 255 }).notNull(),
  website: varchar('website', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const teamMembersTable = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id').notNull().references(() => teamsTable.id, { onDelete: 'cascade' }),
  position: varchar('position', { length: 100 }),
  invitedBy: uuid('invited_by').references(() => usersTable.id, { onDelete: 'set null' }),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex('unique_team_member').on(table.userId, table.teamId),
  index('team_members_team_index').on(table.teamId),
])
