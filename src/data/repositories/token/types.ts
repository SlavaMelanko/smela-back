import type { TokenStatus, TokenType } from '@/security/token'

import type { tokensTable } from '../../schema'

// Database type
export type TokenRecord = typeof tokensTable.$inferSelect

// Input types for create / update / delete / etc
export type CreateTokenInput = typeof tokensTable.$inferInsert
export type UpdateTokenInput = Partial<CreateTokenInput>

// Public-facing / API-return type
export type Token = Omit<TokenRecord, 'type' | 'status'> & {
  type: TokenType
  status: TokenStatus
}
