import type { secureTokensTable } from '@/db/schema'
import type { SecureToken } from '@/types'

// Database type
type TokenRecord = typeof secureTokensTable.$inferSelect

// Input types for create / update / delete / etc.
interface CreateTokenInput {
  userId: number
  type: SecureToken
  token: string
  expiresAt: Date
  metadata?: any
}

interface UpdateTokenInput {
  usedAt?: Date | null
  metadata?: any
}

export { CreateTokenInput, TokenRecord, UpdateTokenInput }
