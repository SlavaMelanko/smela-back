/* eslint-disable no-console, node/no-process-env */

/**
 * Seed fake users for testing GIN/pg_trgm search performance
 *
 * Usage:
 *   # Seed 5000 users (default)
 *   NODE_ENV=development bun src/data/scripts/seed-fake-users.ts
 *
 *   # Seed custom count
 *   NODE_ENV=development bun src/data/scripts/seed-fake-users.ts 10000
 *
 *   # Clear all fake users
 *   NODE_ENV=development bun src/data/scripts/seed-fake-users.ts --clear
 */

import { faker } from '@faker-js/faker'
import { like } from 'drizzle-orm'

import { AuthProvider, Status, USER_ROLES } from '@/types'

import { db } from '../clients'
import { authTable, usersTable } from '../schema'

const BATCH_SIZE = 500
const DEFAULT_COUNT = 5000

// Pre-computed bcrypt hash for "FakeUser123!" to avoid slow hashing
const DUMMY_PASSWORD_HASH = '$2b$10$QKxGzLHk1BrFb7YrLsLnZuvEw3K.vUqhD4TxCPDdKFfqsHVqoA3lC'

const sanitizeForEmail = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '')

const generateUser = (index: number) => {
  const firstName = faker.person.firstName()
  const lastName = faker.helpers.maybe(() => faker.person.lastName(), { probability: 0.9 }) ?? null
  const lastNamePart = lastName ? sanitizeForEmail(lastName) : 'user'

  return {
    firstName,
    lastName,
    email: `${sanitizeForEmail(firstName)}.${lastNamePart}+${index}@test.local`,
    role: faker.helpers.arrayElement(USER_ROLES),
    status: faker.helpers.arrayElement([Status.New, Status.Verified, Status.Active]),
  }
}

const seedFakeUsers = async (count: number) => {
  console.log(`Seeding fake users...`)
  console.log(`Config: ${count} users, batch size ${BATCH_SIZE}`)

  const startTime = performance.now()

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, count - i)

    await db.transaction(async (tx) => {
      // Generate batch of users
      const users = Array.from({ length: batchSize }, (_, j) => generateUser(i + j))

      // Insert users, get IDs
      const inserted = await tx.insert(usersTable).values(users).returning({ id: usersTable.id })

      // Insert auth records (local provider, dummy password hash)
      const authRecords = inserted.map((user, j) => ({
        userId: user.id,
        provider: AuthProvider.Local,
        identifier: users[j].email,
        passwordHash: DUMMY_PASSWORD_HASH,
      }))

      await tx.insert(authTable).values(authRecords)
    })

    const progress = i + batchSize
    if (progress % 1000 === 0 || progress === count) {
      console.log(`Inserted ${progress}/${count} users...`)
    }
  }

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2)
  console.log(`Done! Inserted ${count} users with auth records in ${elapsed}s`)
}

const clearFakeUsers = async () => {
  console.log('Clearing existing fake users...')

  // Delete users with *@test.local emails (auth records cascade automatically)
  const result = await db
    .delete(usersTable)
    .where(like(usersTable.email, '%@test.local'))
    .returning({ id: usersTable.id })

  console.log(`Deleted ${result.length} fake users`)
}

const ALLOWED_ENVS = ['development', 'test', 'staging']

const main = async () => {
  const currentEnv = process.env.NODE_ENV ?? ''
  if (!ALLOWED_ENVS.includes(currentEnv)) {
    console.error(`This script only runs in: ${ALLOWED_ENVS.join(', ')}`)
    process.exit(1)
  }

  const args = process.argv.slice(2)

  // Handle --clear flag
  if (args.includes('--clear')) {
    await clearFakeUsers()

    return
  }

  // Parse count from CLI arg
  const countArg = args[0]
  const count = countArg ? Number.parseInt(countArg, 10) : DEFAULT_COUNT

  if (Number.isNaN(count) || count <= 0) {
    console.error('Invalid count. Usage: bun src/data/scripts/seed-fake-users.ts [count]')
    process.exit(1)
  }

  // Seed faker for reproducible data
  faker.seed(12345)

  await seedFakeUsers(count)
}

main().catch((err) => {
  console.error('Failed to seed fake users:', err)
  process.exit(1)
})
