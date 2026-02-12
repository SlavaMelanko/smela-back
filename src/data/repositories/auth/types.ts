import type { authTable } from '../../schema'

// Database type
export type AuthRecord = typeof authTable.$inferSelect

// Input types for create / update / delete / etc
export type CreateAuthInput = typeof authTable.$inferInsert
export type UpdateAuthInput = Partial<CreateAuthInput>

// Public-facing / API-return type
export type Auth = AuthRecord
