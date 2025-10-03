import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'

import { Role, Status } from '@/types'

import { createPgEnum } from './utils'

export const statusEnum = createPgEnum('status', Status)
export const roleEnum = createPgEnum('role', Role)

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: roleEnum('role').notNull().default(Role.User),
  status: statusEnum('status').notNull().default(Status.New),
  tokenVersion: integer('token_version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  emailIndex: index('email_index').on(table.email),
}))
