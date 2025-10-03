import type { tokensTable } from '@/data/schema'
import type { Token, TokenStatus } from '@/types'

// Database type
export type TokenRecord = typeof tokensTable.$inferSelect

// Input types for create / update / delete / etc
export interface CreateTokenInput {
  userId: number
  type: Token
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
