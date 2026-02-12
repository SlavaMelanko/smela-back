import { sql } from 'drizzle-orm'
import {
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { Status } from '@/types'

import { createPgEnum } from '../utils'

export const statusEnum = createPgEnum('status', Status)

export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => sql`uuidv7()`),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  status: statusEnum('status').notNull().default(Status.New).$type<Status>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
