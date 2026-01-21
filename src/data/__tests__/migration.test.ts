import { beforeEach, describe, expect, test } from 'bun:test'
import { sql } from 'drizzle-orm'

import { testUuids } from '@/__tests__'
import { db } from '@/data/clients/db'
import { authRepo, userRepo } from '@/data/repositories'
import { AuthProvider, Role, Status } from '@/types'

const TEST_EMAIL = 'migration-test@example.com'

describe('@with-db Database Migration Tests', () => {
  beforeEach(async () => {
    await userRepo.delete(TEST_EMAIL)
  })

  describe('Schema Structure', () => {
    test('should have all required tables', async () => {
      const result = await db.execute(sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      `)

      const tableNames = result.rows.map(row => (row as { table_name: string }).table_name)

      expect(tableNames).toContain('users')
      expect(tableNames).toContain('auth')
      expect(tableNames).toContain('permissions')
      expect(tableNames).toContain('role_permissions')
      expect(tableNames).toContain('tokens')
    })

    test('should have correct columns in users table', async () => {
      const result = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `)

      const columns = result.rows.map((row) => {
        const typedRow = row as { column_name: string, data_type: string, is_nullable: string }

        return {
          name: typedRow.column_name,
          type: typedRow.data_type,
          nullable: typedRow.is_nullable === 'YES',
        }
      })

      const columnNames = columns.map(c => c.name)
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('email')
      expect(columnNames).toContain('role')
      expect(columnNames).toContain('status')
      expect(columnNames).toContain('first_name')
      expect(columnNames).toContain('last_name')
      expect(columnNames).toContain('created_at')
      expect(columnNames).toContain('updated_at')
    })
  })

  describe('Data Preservation', () => {
    test('should preserve user data after migration', async () => {
      const testUser = await userRepo.create({
        email: TEST_EMAIL,
        firstName: 'Test',
        lastName: 'User',
        role: Role.User,
        status: Status.New,
      })

      await authRepo.create({
        userId: testUser.id,
        provider: AuthProvider.Local,
        identifier: TEST_EMAIL,
        passwordHash: '$2b$10$hashedpassword',
      })

      const foundUser = await userRepo.findByEmail(TEST_EMAIL)

      expect(foundUser).toBeDefined()
      expect(foundUser?.email).toBe(TEST_EMAIL)
      expect(foundUser?.firstName).toBe('Test')
      expect(foundUser?.lastName).toBe('User')
      expect(foundUser?.role).toBe(Role.User)
      expect(foundUser?.status).toBe(Status.New)
    })
  })

  describe('Constraint Validation', () => {
    test('should enforce unique email constraint', async () => {
      await userRepo.create({
        email: TEST_EMAIL,
        firstName: 'First',
        lastName: 'User',
        role: Role.User,
        status: Status.New,
      })

      expect(
        userRepo.create({
          email: TEST_EMAIL,
          firstName: 'Second',
          lastName: 'User',
          role: Role.User,
          status: Status.New,
        }),
      ).rejects.toThrow()
    })

    test('should cascade delete auth records when user is deleted', async () => {
      const testUser = await userRepo.create({
        email: TEST_EMAIL,
        firstName: 'Test',
        lastName: 'User',
        role: Role.User,
        status: Status.New,
      })

      await authRepo.create({
        userId: testUser.id,
        provider: AuthProvider.Local,
        identifier: TEST_EMAIL,
        passwordHash: '$2b$10$hashedpassword',
      })

      await userRepo.delete(TEST_EMAIL)

      const authResult = await db.execute(sql`
        SELECT * FROM auth WHERE user_id = ${testUser.id}
      `)

      expect(authResult.rows.length).toBe(0)
    })
  })

  describe('Foreign Key Constraints', () => {
    test('should enforce foreign key constraint on auth.user_id', async () => {
      expect(
        authRepo.create({
          userId: testUuids.NON_EXISTENT,
          provider: AuthProvider.Local,
          identifier: 'nonexistent@example.com',
          passwordHash: '$2b$10$hashedpassword',
        }),
      ).rejects.toThrow()
    })

    test('should maintain referential integrity between users and auth', async () => {
      const testUser = await userRepo.create({
        email: TEST_EMAIL,
        firstName: 'Test',
        lastName: 'User',
        role: Role.User,
        status: Status.New,
      })

      const authRecordId = await authRepo.create({
        userId: testUser.id,
        provider: AuthProvider.Local,
        identifier: TEST_EMAIL,
        passwordHash: '$2b$10$hashedpassword',
      })

      expect(authRecordId).toBeGreaterThan(0)

      const authResult = await db.execute(sql`
        SELECT a.*, u.email
        FROM auth a
        JOIN users u ON a.user_id = u.id
        WHERE u.email = ${TEST_EMAIL}
      `)

      expect(authResult.rows.length).toBe(1)
      expect(authResult.rows[0].email).toBe(TEST_EMAIL)
    })
  })
})
