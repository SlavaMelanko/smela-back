import type { TokenStatus, TokenType } from '@/security/token'

import type { tokensTable } from '../../schema'

// Database type
export type TokenRecord = typeof tokensTable.$inferSelect

// Input types for create / update / delete / etc
export interface CreateTokenInput {
  userId: number
  type: TokenType
  status?: TokenStatus
  token: string
  expiresAt: Date
  metadata?: any
}

export interface UpdateTokenInput {
  status?: TokenStatus
  usedAt?: Date | null
  metadata?: any
}
