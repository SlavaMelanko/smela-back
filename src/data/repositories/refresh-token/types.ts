import type { refreshTokensTable } from '../../schema'

// Database type
export type RefreshTokenRecord = typeof refreshTokensTable.$inferSelect

// Input types for create / update / delete / etc
export type CreateRefreshTokenInput = typeof refreshTokensTable.$inferInsert
export type UpdateRefreshTokenInput = Partial<CreateRefreshTokenInput>

// Public-facing / API-return type
export type RefreshToken = RefreshTokenRecord
