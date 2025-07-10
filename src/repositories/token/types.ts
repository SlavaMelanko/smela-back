import type { tokensTable } from '@/db/schema'
import type { Token, TokenStatus } from '@/types'

// Database type
type TokenRecord = typeof tokensTable.$inferSelect

// Input types for create / update / delete / etc.
interface CreateTokenInput {
  userId: number
  type: Token
  status?: TokenStatus
  token: string
  expiresAt: Date
  metadata?: any
}

interface UpdateTokenInput {
  status?: TokenStatus
  usedAt?: Date | null
  metadata?: any
}

export { CreateTokenInput, TokenRecord, UpdateTokenInput }
