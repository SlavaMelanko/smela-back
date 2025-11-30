import type { refreshTokensTable } from '../../schema'

// Database type
export type RefreshTokenRecord = typeof refreshTokensTable.$inferSelect

// Input types for create
export type CreateRefreshTokenInput = typeof refreshTokensTable.$inferInsert

// Public-facing / API-return type
export type RefreshToken = RefreshTokenRecord
