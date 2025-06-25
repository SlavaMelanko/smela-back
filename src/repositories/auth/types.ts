import type { authTable } from '@/db/schema'

// Database type
type AuthRecord = typeof authTable.$inferSelect

// Input types for create / update / delete / etc.
type CreateAuthInput = typeof authTable.$inferInsert
type UpdateAuthInput = Partial<CreateAuthInput>

export { AuthRecord, CreateAuthInput, UpdateAuthInput }
